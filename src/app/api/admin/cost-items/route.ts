import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("cost_items")
    .select("*")
    .order("due_date", { ascending: true });

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { name, amount, frequency, category, due_date, is_paid, notes } = body;

  if (!name || amount === undefined) {
    return NextResponse.json({ error: "name and amount required" }, { status: 400 });
  }

  const { data, error: insertErr } = await supabaseAdmin
    .from("cost_items")
    .insert({ name, amount, frequency: frequency || "monthly", category: category || "other", due_date: due_date || null, is_paid: is_paid || false, notes: notes || null })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const cleanUpdates: Record<string, unknown> = {};
  const allowed = ["name", "amount", "frequency", "category", "due_date", "is_paid", "paid_at", "notes"];
  for (const key of allowed) {
    if (updates[key] !== undefined) cleanUpdates[key] = updates[key];
  }

  const { error: updateErr } = await supabaseAdmin
    .from("cost_items")
    .update(cleanUpdates)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await supabaseAdmin.from("cost_items").delete().eq("id", body.id);
  return NextResponse.json({ ok: true });
}
