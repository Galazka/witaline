import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function internalSecret() {
  return process.env.HANDOFF_TRANSCRIPTION_SECRET || process.env.INTERNAL_WEBHOOK_SECRET || "";
}

function validateInternalRequest(request: Request) {
  const secret = internalSecret();
  if (!secret) return true;
  return request.headers.get("x-witaline-internal-secret") === secret;
}

function twilioAuth(): string | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("webm")) return "webm";
  return "mp3";
}

async function fetchRecordingBuffer(recordingUrl: string) {
  const auth = twilioAuth();
  if (!auth) throw new Error("Twilio credentials are not configured");

  const res = await fetch(recordingUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Twilio recording fetch failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "audio/mpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType, extension: extensionFromContentType(contentType) };
}

async function transcribeWithElevenLabs(buffer: Buffer, contentType: string, extension: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: contentType }),
    `handoff-recording.${extension}`
  );
  form.append("model_id", "scribe_v1");
  form.append("language_code", "pl");
  form.append("diarize", "true");
  form.append("num_speakers", "2");
  form.append("file_type", contentType);

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs STT failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json() as { text?: string; transcript?: string };
  return (data.text || data.transcript || "").trim();
}

async function summarizeWithOpenRouter(transcript: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return transcript.slice(0, 800) ? `Podsumowanie podstawowe:\n${transcript.slice(0, 800)}` : "";
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3.6-35b-a3b",
      messages: [
        {
          role: "system",
          content: "Jesteś ekspertem od podsumowywania rozmów telefonicznych po przekazaniu do konsultanta. Odpowiadaj po polsku. Bądź konkretny, krótki i biznesowy. Nie wymyślaj faktów.",
        },
        {
          role: "user",
          content: `Podsumuj rozmowę klienta z konsultantem. Wyciągnij temat, ustalenia, dane kontaktowe, następne kroki i sentiment. Format:\n- Temat:\n- Ustalenia:\n- Dane klienta:\n- Następne kroki:\n- Sentiment:\n\nTranskrypcja:\n${transcript.slice(0, 6000)}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter summary failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "";
}

async function updateConversationSummary(businessId: string, callerId: string, summary: string) {
  if (!businessId || !callerId) return;

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id, summary")
    .eq("business_id", businessId)
    .eq("caller_id", callerId)
    .eq("channel", "voice")
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conversation?.id) return;

  const separator = conversation.summary ? "\n\n" : "";
  await supabaseAdmin
    .from("conversations")
    .update({ summary: `${conversation.summary || ""}${separator}== Segment konsultanta ==\n${summary}` })
    .eq("id", conversation.id);
}

export async function POST(request: Request) {
  if (!validateInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    callLogId?: string;
    recordingSid?: string;
    recordingUrl?: string;
    targetNumber?: string;
    reason?: string;
  };

  if (!body.callLogId || !body.recordingUrl) {
    return NextResponse.json({ error: "Missing callLogId or recordingUrl" }, { status: 400 });
  }

  try {
    await supabaseAdmin
      .from("call_logs")
      .update({ post_handoff_transcription_status: "processing" })
      .eq("id", body.callLogId);

    const { buffer, contentType, extension } = await fetchRecordingBuffer(body.recordingUrl);
    const transcript = await transcribeWithElevenLabs(buffer, contentType, extension);
    const summary = await summarizeWithOpenRouter(transcript);

    const { data: callLog } = await supabaseAdmin
      .from("call_logs")
      .select("business_id, caller_id")
      .eq("id", body.callLogId)
      .single();

    await supabaseAdmin
      .from("call_logs")
      .update({
        has_human_handoff: true,
        handoff_status: "completed",
        handoff_target_number: body.targetNumber || "",
        handoff_reason: body.reason || "",
        post_handoff_transcript: transcript,
        post_handoff_summary: summary,
        post_handoff_transcription_status: "completed",
        post_handoff_transcribed_at: new Date().toISOString(),
        post_handoff_error: "",
      })
      .eq("id", body.callLogId);

    await updateConversationSummary(callLog?.business_id || "", callLog?.caller_id || "", summary);

    return NextResponse.json({
      ok: true,
      callLogId: body.callLogId,
      recordingSid: body.recordingSid || "",
      transcriptLength: transcript.length,
      summaryLength: summary.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transcribe-handoff-recording] failed:", message);

    await supabaseAdmin
      .from("call_logs")
      .update({
        post_handoff_transcription_status: "failed",
        post_handoff_error: message.slice(0, 1000),
      })
      .eq("id", body.callLogId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
