import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversation_id, transcript, audio, metadata } = body;
  // Zapisz do bazy
  await supabase.from("call_logs").insert({
    conversation_id,
    transcript,
    audio_url: audio?.url,
    business_id: metadata?.business_id,
    created_at: new Date().toISOString()
  });
  return new NextResponse("ok");
}
