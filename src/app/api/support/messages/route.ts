import { NextRequest, NextResponse } from "next/server";
import { checkSupportAuth } from "@/lib/support-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { error } = await checkSupportAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversation_id");

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id is required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error, agent, user } = await checkSupportAuth();
  if (error) return error;

  const body = await req.json();
  const { conversation_id, content } = body;

  if (!conversation_id || !content) {
    return NextResponse.json({ error: "conversation_id and content are required" }, { status: 400 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      conversation_id,
      sender_type: "agent",
      sender_id: user!.id,
      sender_name: user!.email || "Support",
      content,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}