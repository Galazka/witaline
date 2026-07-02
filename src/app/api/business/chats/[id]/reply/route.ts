import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const content = (body.content || "").trim();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data: conv, error: convErr } = await supabaseAdmin
    .from("conversations")
    .select("business_id")
    .eq("id", id)
    .single();

  if (convErr || !conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("id", conv.business_id)
    .eq("owner_uid", session.user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: msg, error: msgErr } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: id,
      business_id: conv.business_id,
      role: "human",
      content,
    })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  const { data: convUpdate } = await supabaseAdmin
    .from("conversations")
    .select("message_count")
    .eq("id", id)
    .single();
  const currentCount = (convUpdate as any)?.message_count ?? 0;
  await supabaseAdmin
    .from("conversations")
    .update({ status: "active", message_count: currentCount + 1 })
    .eq("id", id);

  return NextResponse.json({ message: msg });
}
