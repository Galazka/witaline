import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { conversationId, rating } = await request.json();

    if (!conversationId || !rating) {
      return NextResponse.json({ error: "Missing conversationId or rating" }, { status: 400 });
    }

    if (![1, 2, 3].includes(rating)) {
      return NextResponse.json({ error: "Rating must be 1 (sad), 2 (neutral), or 3 (happy)" }, { status: 400 });
    }

    // Try to get business_id from conversation
    let businessId: string | null = null;
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("business_id")
      .eq("id", conversationId)
      .single();

    if (conv) businessId = conv.business_id;

    const { error } = await supabaseAdmin
      .from("feedback")
      .insert({
        conversation_id: conversationId,
        business_id: businessId,
        rating,
        category: "general",
        caller_phone: "widget",
        source: "widget",
      });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback widget error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
