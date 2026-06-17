import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function checkAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email !== adminEmail) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function GET(req: Request) {
  const auth = await checkAuth();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "active";

  let query = supabaseAdmin
    .from("callback_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (view === "active") query = query.is("deleted_at", null);
  else if (view === "trashed") query = query.not("deleted_at", "is", null);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function PATCH(request: Request) {
  const auth = await checkAuth();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  let updateData: Record<string, unknown> = {};

  switch (body.action) {
    case "trash":
      updateData = { deleted_at: new Date().toISOString() };
      break;
    case "restore":
      updateData = { deleted_at: null };
      break;
    case "handled":
      updateData = { handled: true };
      break;
    case "unhandled":
      updateData = { handled: false };
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("callback_requests")
    .update(updateData)
    .in("id", body.ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await checkAuth();
  if (auth.error) return auth.error;

  const { ids } = await request.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("callback_requests")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
