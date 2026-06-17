import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id, voice_id, current_plan")
    .eq("owner_uid", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: allVoices } = await supabaseAdmin
    .from("voices")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const planOrder = ["start_100", "pro_500", "enterprise_2000"];
  const bizIdx = planOrder.indexOf(biz.current_plan);

  const available = (allVoices || []).filter(v => {
    const minIdx = planOrder.indexOf(v.min_plan);
    return bizIdx >= minIdx;
  });

  return NextResponse.json({
    voiceId: biz.voice_id,
    currentPlan: biz.current_plan,
    available,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { voiceId } = await request.json();

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id, current_plan")
    .eq("owner_uid", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (voiceId) {
    const { data: voice } = await supabaseAdmin
      .from("voices")
      .select("id, min_plan")
      .eq("id", voiceId)
      .single();

    if (!voice) return NextResponse.json({ error: "Voice not found" }, { status: 404 });

const planOrder = ["elastic_0", "start_100", "pro_249", "pro_500", "lux_599", "enterprise_2000"];
    if (planOrder.indexOf(biz.current_plan) < planOrder.indexOf(voice.min_plan)) {
      return NextResponse.json({ error: "Ten głos nie jest dostępny dla Twojego planu." }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ voice_id: voiceId || null })
    .eq("id", biz.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
