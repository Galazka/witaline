import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_1501krvm9y90e549tyg96mgczsfv";

export async function GET() {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const { data, error } = await supabaseAdmin
    .from("voices")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PATCH(request: Request) {
  const auth = await checkAdminAuth();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "set_default") {
    const { voiceId } = body;
    if (!voiceId) return NextResponse.json({ error: "Missing voiceId" }, { status: 400 });

    await supabaseAdmin.from("voices").update({ is_default: false }).not("id", "is", null);
    const { error } = await supabaseAdmin.from("voices").update({ is_default: true }).eq("id", voiceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "set_business_voice") {
    const { businessId, voiceId } = body;
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ voice_id: voiceId || null })
      .eq("id", businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "sync_elevenlabs") {
    const { data: defaultVoice } = await supabaseAdmin
      .from("voices")
      .select("elevenlabs_voice_id, display_name")
      .eq("is_default", true)
      .single();

    if (!defaultVoice) return NextResponse.json({ error: "No default voice configured" }, { status: 400 });

    try {
      // Validate that the voice exists in ElevenLabs
      const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
      });

      if (!voicesRes.ok) {
        return NextResponse.json({ error: "Cannot verify ElevenLabs voices" }, { status: 500 });
      }

      const voicesData = await voicesRes.json();
      const validVoices = voicesData.voices || [];
      const voiceExists = validVoices.some((v: { voice_id: string }) => v.voice_id === defaultVoice.elevenlabs_voice_id);

      const voiceId = voiceExists
        ? defaultVoice.elevenlabs_voice_id
        : "tWVHsc0fuVfAZWfScX9a"; // fallback to Maja

      if (!voiceExists) {
        // Update DB to reflect fallback
        await supabaseAdmin.from("voices").update({ is_default: false }).not("id", "is", null);
        const { data: fallbackVoice } = await supabaseAdmin
          .from("voices")
          .update({ is_default: true })
          .eq("elevenlabs_voice_id", voiceId)
          .select("display_name")
          .single();

        const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
          method: "PATCH",
          headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_config: { tts: { voice_id: voiceId } } }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json({ error: `ElevenLabs API: ${errText}` }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          voice: fallbackVoice?.display_name || "Maja",
          warning: `Głos "${defaultVoice.display_name}" nie istnieje w ElevenLabs. Ustawiono domyślny: Maja.`,
        });
      }

      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
        method: "PATCH",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_config: { tts: { voice_id: voiceId } } }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `ElevenLabs API: ${errText}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, voice: defaultVoice.display_name });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Sync failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
