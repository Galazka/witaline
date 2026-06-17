import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function PATCH(request: Request) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  let updateData: Record<string, unknown>;
  switch (body.action) {
    case "trash":
      updateData = { deleted_at: new Date().toISOString(), deleted_by: "admin" };
      break;
    case "restore":
      updateData = { deleted_at: null, deleted_by: null };
      break;
    case "hard_delete":
      const { error: delErr } = await supabaseAdmin
        .from("call_logs")
        .delete()
        .in("id", body.ids);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      return NextResponse.json({ success: true, hard_deleted: body.ids.length });
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("call_logs")
    .update(updateData)
    .in("id", body.ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, affected: body.ids.length });
}
