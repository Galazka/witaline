import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_uid", user.id)
    .maybeSingle();
  if (!biz) {
    return NextResponse.json({ error: "No business" }, { status: 404 });
  }

  const body = await request.json();
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  let updateData: Record<string, unknown>;
  switch (body.action) {
    case "trash":
      updateData = { deleted_at: new Date().toISOString(), deleted_by: "business" };
      break;
    case "restore":
      updateData = { deleted_at: null, deleted_by: null };
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("call_logs")
    .update(updateData)
    .in("id", body.ids)
    .eq("business_id", biz.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, affected: body.ids.length });
}
