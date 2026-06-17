import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, system_prompt, industry, website_url, phone, twilio_number, current_plan, voice_id")
    .eq("owner_uid", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

  // Get voice info
  let voiceName = "Maja";
  if (business.voice_id) {
    const { data: voice } = await supabaseAdmin
      .from("voices")
      .select("display_name")
      .eq("id", business.voice_id)
      .maybeSingle();
    if (voice) voiceName = voice.display_name;
  }

  // Get knowledge entries count
  const { count: knowledgeCount } = await supabaseAdmin
    .from("business_knowledge")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      systemPrompt: business.system_prompt,
      industry: business.industry,
      websiteUrl: business.website_url,
      phone: business.phone,
      twilioNumber: business.twilio_number,
      plan: business.current_plan,
      voiceName,
      knowledgeCount: knowledgeCount || 0,
    },
  });
}
