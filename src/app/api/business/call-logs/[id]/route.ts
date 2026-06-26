import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data: log, error: logErr } = await supabaseAdmin
    .from("call_logs")
    .select("business_id")
    .eq("id", id)
    .single();

  if (logErr || !log) return NextResponse.json({ error: "Call log not found" }, { status: 404 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("id", log.business_id)
    .eq("owner_uid", session.user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: Record<string, any> = {};
  if (body.flagged !== undefined) updates.flagged = body.flagged;
  if (body.flag_color !== undefined) updates.flag_color = body.flag_color;
  if (body.deleted !== undefined) updates.deleted_at = body.deleted ? new Date().toISOString() : null;

  const { error } = await supabaseAdmin
    .from("call_logs")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
