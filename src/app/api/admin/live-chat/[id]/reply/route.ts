import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id, business_id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: id,
      business_id: conversation.business_id,
      role: "human",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (conversation.status === "ended" || conversation.status === "archived") {
    await supabaseAdmin
      .from("conversations")
      .update({ status: "active" })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true, message });
}
