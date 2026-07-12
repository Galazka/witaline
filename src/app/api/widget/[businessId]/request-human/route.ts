import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const body = await request.json().catch(() => ({}));
  const conversationId = body.conversationId as string | undefined;

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("id, status, tags, caller_name, caller_id")
    .eq("id", conversationId)
    .eq("business_id", businessId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const existingTags = (conv.tags || []) as string[];
  if (!existingTags.includes("oczekuje_na_konsultanta")) {
    await supabaseAdmin
      .from("conversations")
      .update({ tags: [...existingTags, "oczekuje_na_konsultanta"], status: "active" })
      .eq("id", conversationId);
  }

  await supabaseAdmin.from("notifications").insert({
    business_id: businessId,
    type: "lead",
    title: "Klient prosi o konsultanta",
    message: `${conv.caller_name || conv.caller_id || "Klient"} poprosił o rozmowę z konsultantem przez widget.`,
    metadata: { conversation_id: conversationId, source: "widget_transfer" },
  });

  return NextResponse.json({ success: true });
}
