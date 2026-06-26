import { NextRequest, NextResponse } from "next/server";
import { checkSupportAuth } from "@/lib/support-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { error, agent } = await checkSupportAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assigned = searchParams.get("assigned");

  let query = supabaseAdmin
    .from("support_conversations")
    .select(`
      *,
      business:businesses(name),
      messages:support_messages(count)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (assigned === "me") {
    query = query.eq("assigned_to", agent!.id);
  } else if (assigned === "unassigned") {
    query = query.is("assigned_to", null);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error, agent } = await checkSupportAuth();
  if (error) return error;

  const body = await req.json();
  const { business_id, customer_phone, customer_name, source } = body;

  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("support_conversations")
    .insert({
      business_id,
      customer_phone: customer_phone || null,
      customer_name: customer_name || null,
      source: source || "transfer",
      assigned_to: agent!.id,
      status: "open",
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Add system message
  await supabaseAdmin
    .from("support_messages")
    .insert({
      conversation_id: data.id,
      sender_type: "system",
      content: `Rozpoczęto rozmowę. Obsługuje ${agent!.role === "admin" ? "admin" : "konsultant"}.`,
    });

  return NextResponse.json(data, { status: 201 });
}