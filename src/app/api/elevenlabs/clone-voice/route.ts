import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { business_id, name, sample_urls } = await request.json() as {
      business_id: string;
      name: string;
      sample_urls: string[];
    };

    if (!business_id || !name || !sample_urls?.length) {
      return NextResponse.json({ error: "Missing required fields: business_id, name, sample_urls" }, { status: 400 });
    }

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .select("id, current_plan")
      .eq("id", business_id)
      .single();

    if (bizErr || !biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (biz.current_plan !== "enterprise_2000") {
      return NextResponse.json({ error: "Voice cloning is only available on the Enterprise plan" }, { status: 403 });
    }

    const formData = new FormData();
    formData.append("name", name);

    for (const url of sample_urls) {
      try {
        const audioRes = await fetch(url);
        if (!audioRes.ok) continue;
        const blob = await audioRes.blob();
        const filename = url.split("/").pop() || "sample.mp3";
        formData.append("files", blob, filename);
      } catch {
        console.warn("[clone-voice] failed to fetch sample:", url);
      }
    }

    let elevenlabsVoiceId: string | null = null;
    let status: "active" | "failed" = "active";

    try {
      const elevenRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: formData,
      });

      if (!elevenRes.ok) {
        const errText = await elevenRes.text();
        console.error("[clone-voice] ElevenLabs API error:", errText);
        status = "failed";
      } else {
        const elevenData = await elevenRes.json() as { voice_id: string };
        elevenlabsVoiceId = elevenData.voice_id;
      }
    } catch (err) {
      console.error("[clone-voice] ElevenLabs request failed:", err);
      status = "failed";
    }

    if (elevenlabsVoiceId) {
      await supabaseAdmin.from("voice_clones").upsert({
        business_id,
        elevenlabs_voice_id: elevenlabsVoiceId,
        display_name: name,
        status: "active",
        samples_urls: JSON.stringify(sample_urls),
      }, { onConflict: "business_id" });

      await supabaseAdmin
        .from("businesses")
        .update({ voice_id: elevenlabsVoiceId })
        .eq("id", business_id);

      return NextResponse.json({
        success: true,
        voice_id: elevenlabsVoiceId,
        display_name: name,
        status: "active",
      });
    }

    await supabaseAdmin.from("voice_clones").upsert({
      business_id,
      elevenlabs_voice_id: "failed",
      display_name: name,
      status: "failed",
      samples_urls: JSON.stringify(sample_urls),
    }, { onConflict: "business_id" });

    return NextResponse.json({ success: false, status: "failed", error: "ElevenLabs voice cloning failed" }, { status: 500 });
  } catch (err) {
    console.error("[clone-voice]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
