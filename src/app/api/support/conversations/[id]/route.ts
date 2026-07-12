import { NextRequest, NextResponse } from "next/server";
import { checkSupportAuth } from "@/lib/support-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkSupportAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbError } = await supabaseAdmin
    .from("support_conversations")
    .select(`
      *,
      business:businesses(name, phone),
      assigned:assigned_to(id, role)
    `)
    .eq("id", id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, agent } = await checkSupportAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { status, assigned_to, customer_name } = body;

  const updates: Record<string, unknown> = {};

  if (status) {
    updates.status = status;
    if (status === "closed") {
      updates.closed_at = new Date().toISOString();
      updates.closed_by = agent!.user_id;
    }
  }
  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
  if (customer_name !== undefined) updates.customer_name = customer_name;

  const { data, error: dbError } = await supabaseAdmin
    .from("support_conversations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // System message for status change
  if (status) {
    let msg = "";
    if (status === "closed") msg = "Rozmowa zakończona.";
    else if (status === "open") msg = "Rozmowa wznowiona.";
    else if (status === "pending") msg = "Rozmowa oczekuje na odpowiedź.";
    if (msg) {
      await supabaseAdmin.from("support_messages").insert({
        conversation_id: id,
        sender_type: "system",
        content: msg,
      });
    }
  }

  return NextResponse.json(data);
}