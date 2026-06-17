import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { is_read?: boolean };

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: body.is_read ?? true })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notification:patch]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notification:delete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json() as { action?: string };

    if (body.action === "mark_all_read") {
      const { data: notif, error: fetchError } = await supabaseAdmin
        .from("notifications")
        .select("business_id")
        .eq("id", id)
        .single();

      if (fetchError || !notif) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("business_id", notif.business_id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[notification:post]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
