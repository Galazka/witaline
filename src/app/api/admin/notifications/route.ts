import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const { data: notifications, count } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const unreadCount = notifications
    ? notifications.filter((n: { is_read: boolean }) => !n.is_read).length
    : 0;

  return NextResponse.json({
    notifications: notifications || [],
    unread_count: unreadCount,
    total: count || 0,
  });
}

export async function PATCH(request: Request) {
  const { error: authErr } = await checkAdminAuth();
  if (authErr) return authErr;

  const body = await request.json();

  if (body.mark_all_read) {
    const { error: updateErr } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .is("is_read", false);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    const updates: Record<string, unknown> = {};
    if (body.is_read !== undefined) updates.is_read = body.is_read;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    const { error: updateErr } = await supabaseAdmin
      .from("notifications")
      .update(updates)
      .eq("id", body.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing id or mark_all_read" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { error: authErr } = await checkAdminAuth();
  if (authErr) return authErr;

  const body = await request.json();

  if (body.id) {
    const { error: deleteErr } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", body.id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing id" }, { status: 400 });
}
