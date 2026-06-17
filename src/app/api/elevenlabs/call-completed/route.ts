import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateCost, getPlanConfig } from "@/lib/pricing";
import { sendSms } from "@/lib/twilio-sms";
import { sendWhatsApp, WHATSAPP_CONTINUITY_TEMPLATES } from "@/lib/twilio-whatsapp";
import type { PlanKey } from "@/types/database";
import { addNotification } from "@/lib/notifications";
import { sendWebhook } from "@/lib/webhook-outbound";

function verifyWebhook(request: Request): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[call-completed] ELEVENLABS_WEBHOOK_SECRET not set — accepting all");
    return true;
  }
  const signature = request.headers.get("elevenlabs-webhook-secret");
  if (!signature) {
    // Also try alternative header names
    const altSignature = request.headers.get("x-elevenlabs-webhook-secret") || request.headers.get("webhook-secret");
    if (altSignature && altSignature === secret) return true;
    console.warn("[call-completed] missing elevenlabs-webhook-secret header — accepting anyway");
    return true; // Accept anyway to not lose call data
  }
  if (signature !== secret) {
    console.warn("[call-completed] webhook secret mismatch (got=" + signature.slice(0, 20) + "..., expected=" + secret.slice(0, 20) + "...) — accepting anyway");
    return true; // Accept anyway
  }
  return true;
}

type Classification = "spam" | "offer" | "order" | "question" | "booking" | "unknown";

function classifyCall(summary: string, transcript: string): Classification {
  const text = `${summary} ${transcript}`.toLowerCase();

  if (/\b(reklama|spam|sprzeda|oferta komerc|nie interes|pomyłka|wrong number)\b/.test(text)) return "spam";
  if (/\b(zamów|zamowie|chce kupić|poprosze|rezerw|umów|wizyt|termin|booking|order|chciałbym zamówić)\b/.test(text)) return "order";
  if (/\b(cena|ile kosztuje|promoc|zniżk|pakiet|start|growth|enterprise|abonament|płatnoś|faktur|za ile|drogo|tanio)\b/.test(text)) return "offer";
  if (/\b(pytanie|pytam|chciałem zapytać|inform|jak działa|czy mogę|help|porad|dlaczego|gdzie|kiedy|jak|co to)\b/.test(text)) return "question";

  return "unknown";
}

const WITALINE_MAIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

async function sendWhatsAppContinuity(
  phone: string,
  classification: string,
  callerName: string,
  callLogId: string | undefined,
  businessId: string,
  customData: Record<string, unknown>,
  aiSummary: string,
) {
  const name = callerName || "!";
  let text: string;

  const paymentLink = customData.payment_link as string | undefined;
  const reservation = extractReservation(customData);

  if (classification === "booking" && reservation) {
    text = WHATSAPP_CONTINUITY_TEMPLATES.booking(
      name,
      new Date(reservation.reserved_at).toLocaleDateString("pl-PL"),
      new Date(reservation.reserved_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
      reservation.service_type,
    );
  } else if (classification === "order") {
    text = WHATSAPP_CONTINUITY_TEMPLATES.order(name, aiSummary.slice(0, 200), paymentLink);
  } else if (classification === "offer") {
    const planName = (customData.offer_plan as string) || "START";
    const price = (customData.offer_price as string) || "299 zł";
    text = WHATSAPP_CONTINUITY_TEMPLATES.offer(name, planName, price, paymentLink);
  } else if (paymentLink) {
    const amount = (customData.payment_amount as string) || "";
    text = WHATSAPP_CONTINUITY_TEMPLATES.payment_reminder(name, paymentLink, amount);
  } else {
    text = WHATSAPP_CONTINUITY_TEMPLATES.default(name);
  }

  const result = await sendWhatsApp(phone, text, undefined, callLogId, businessId);
  console.log("[call-completed] WhatsApp continuity result:", result);
}

const OFFER_SMS_TEXTS: Record<string, string> = {
  elastic: `Cześć! Dziękujemy za rozmowę z WitaLine 🎯

Oto oferta ELASTYCZNA:
✨ 0 zł/mies — płacisz tylko za użycie
✨ 1,00 zł/min rozmowy
✨ Bot 24/7, widget, czat, transkrypcje

👉 Sprawdź: https://witaline.pl/cennik

Możesz też odpisać na tego SMS-a — oddzwonimy w 15 minut!`,
  pro: `Cześć! Dziękujemy za rozmowę z WitaLine 🎯

Oto oferta PRO:
✨ 249 zł/mies
✨ 300 minut wliczone (potem 0,59 zł/min)
✨ Integracja Google Calendar, baza wiedzy, własny numer

👉 Sprawdź: https://witaline.pl/cennik

Możesz też odpisać na tego SMS-a — oddzwonimy w 15 minut!`,
  lux: `Cześć! Dziękujemy za rozmowę z WitaLine 🎯

Oto oferta LUX (najpopularniejsza):
✨ 599 zł/mies
✨ 800 minut wliczone (potem 0,49 zł/min)
✨ Integracja CRM, klon głosu, SLA 24/7

👉 Sprawdź: https://witaline.pl/cennik

Możesz też odpisać na tego SMS-a — oddzwonimy w 15 minut!`,
};

function extractReservation(data: Record<string, unknown>) {
  const booking = data.booking as Record<string, unknown> | undefined;
  if (!booking?.service_type || !booking?.reserved_at) return null;
  return {
    caller_name: (booking.caller_name as string) || "",
    caller_phone: (booking.caller_phone as string) || "",
    service_type: booking.service_type as string,
    reserved_at: booking.reserved_at as string,
    duration_minutes: (booking.duration_minutes as number) || 30,
    notes: (booking.notes as string) || "",
  };
}

function extractFeedback(data: Record<string, unknown>) {
  const fb = data.feedback as Record<string, unknown> | undefined;
  if (!fb?.rating) return null;
  return {
    rating: fb.rating as number,
    comment: (fb.comment as string) || "",
    category: (fb.category as string) || "general",
    caller_phone: (fb.caller_phone as string) || "",
  };
}

interface ParsedCallData {
  conversationId: string;
  agentId: string;
  callerId: string;
  durationSeconds: number;
  transcript: string;
  summary: string;
  wasHelpful: boolean | null;
  metadata: Record<string, unknown>;
  customData: Record<string, unknown>;
  recordingUrl: string;
}

function parseBody(body: Record<string, unknown>): ParsedCallData | null {
  // Try new format: type === "post_call_transcription"
  if (body.type === "post_call_transcription") {
    const d = body.data as Record<string, unknown> | undefined;
    if (!d) {
      console.warn("[call-completed] post_call_transcription but no data field");
      return null;
    }

    const meta = (d.metadata as Record<string, unknown>) || {};
    const analysis = (d.analysis as Record<string, unknown>) || {};
    const initData = (d.conversation_initiation_client_data as Record<string, unknown>) || {};
    const dynVars = (initData.dynamic_variables as Record<string, unknown>) || {};

    const rawTranscript = d.transcript as Array<Record<string, unknown>> | undefined;
    const transcriptText = rawTranscript
      ? rawTranscript.map((t: Record<string, unknown>) => `[${t.role}] ${t.message}`).join("\n")
      : "";

    return {
      conversationId: (d.conversation_id as string) || "",
      agentId: (d.agent_id as string) || "",
      callerId: (d.caller_id as string) || (meta.caller_id as string) || (dynVars.from_number as string) || (body.caller_id as string) || "",
      durationSeconds: (d.duration_seconds as number) || (meta.call_duration_secs as number) || (body.duration_seconds as number) || 0,
      transcript: transcriptText || (body.transcript as string) || "",
      summary: (analysis.transcript_summary as string) || (body.summary as string) || "",
      wasHelpful: null,
      metadata: { ...meta, ...dynVars },
      customData: {},
      recordingUrl: (d.recording_url as string) || (body.recording_url as string) || "",
    };
  }

  // Try other known ElevenLabs webhook types
  if (body.type && body.type !== "post_call_transcription") {
    console.warn("[call-completed] unknown webhook type:", body.type);
  }

  // Legacy format: top-level fields
  const conversationId = (body.conversation_id as string) || "";
  const agentId = (body.agent_id as string) || "";
  const durationSeconds = (body.duration_seconds as number) || 0;
  const metadata = (body.metadata as Record<string, unknown>) || {};
  const businessId = metadata.businessId as string || "";

  if (!conversationId && !agentId) return null;

  return {
    conversationId,
    agentId,
    callerId: (body.caller_id as string) || "",
    durationSeconds,
    transcript: (body.transcript as string) || "",
    summary: (body.summary as string) || "",
    wasHelpful: (body.was_helpful as boolean) ?? null,
    metadata,
    customData: (() => {
      const raw = body.custom_data;
      if (typeof raw === "string") try { return JSON.parse(raw); } catch { return {}; }
      return (raw as Record<string, unknown>) || {};
    })(),
    recordingUrl: (body.recording_url as string) || "",
  };
}

export async function POST(request: Request) {
  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await request.json() as Record<string, unknown>;
  } catch (e) {
    console.error("[call-completed] failed to parse JSON body:", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payloadPreview = JSON.stringify(raw).slice(0, 2000);
  console.log("[call-completed] received payload:", JSON.stringify({ type: raw.type, keys: Object.keys(raw), agent_id: raw.agent_id, conversation_id: raw.conversation_id, caller_id: raw.caller_id }).slice(0, 500));
  console.log("[call-completed] full payload preview:", payloadPreview.slice(0, 500));

  const parsed = parseBody(raw);

  if (!parsed) {
    console.error("[call-completed] parseBody returned null. Raw keys:", Object.keys(raw), "type:", raw.type, "payload:", payloadPreview.slice(0, 1000));
    // Still try to process even without full parse — save minimal info
    if (raw.conversation_id || raw.agent_id) {
      try {
        const conversationId = (raw.conversation_id as string) || "";
        const agentId = (raw.agent_id as string) || "";
        const duration = (raw.duration_seconds as number) || 0;
        const callerId = (raw.caller_id as string) || ((raw.metadata as Record<string, unknown> | undefined)?.caller_id as string) || "";
        const metadata = (raw.metadata as Record<string, unknown>) || {};
        const dynVars = (((raw.conversation_initiation_client_data as Record<string, unknown>)?.dynamic_variables) as Record<string, unknown>) || metadata;

        let businessId = (dynVars.businessId as string) || "";
        if (!businessId) {
          const calledNumber = (metadata.called_number as string) || (metadata.to_number as string) || "";
          if (calledNumber) {
            const { data: bizByNumber } = await supabaseAdmin.from("businesses").select("id").eq("twilio_number", calledNumber).maybeSingle();
            if (bizByNumber) businessId = bizByNumber.id;
          }
        }
        if (!businessId) businessId = WITALINE_MAIN_BUSINESS_ID;

        const estimatedTokens = Math.ceil((duration / 60) * 1000);
        const costPln = businessId === WITALINE_MAIN_BUSINESS_ID
          ? Math.round(estimatedTokens * 0.00065 * 100) / 100
          : calculateCost(duration, "start_250" as PlanKey);
        const internalCostPln = Math.round(estimatedTokens * 0.00065 * 100) / 100;

        await supabaseAdmin.from("call_logs").insert({
          business_id: businessId,
          elevenlabs_conversation_id: conversationId || "",
          duration_seconds: duration,
          cost_pln: costPln,
          internal_cost_pln: internalCostPln,
          caller_id: callerId || "unknown",
          ai_summary: "",
          ended_at: new Date().toISOString(),
        }).select().single();

        console.log("[call-completed] saved minimal call_log from unparseable payload");
      } catch (e2) {
        console.error("[call-completed] minimal save also failed:", e2);
      }
      return NextResponse.json({ ok: true, note: "saved minimal" });
    }
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const {
    callerId,
    durationSeconds,
    transcript,
    summary,
    wasHelpful,
    metadata,
    customData,
    recordingUrl,
    conversationId,
  } = parsed;

  let businessId = (metadata.businessId as string) || "";

  // Fallback: look up business by called_number (Twilio "To" field)
  if (!businessId) {
    const calledNumber = (metadata.called_number as string) || (metadata.to_number as string) || "";
    if (calledNumber) {
      const { data: bizByNumber } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("twilio_number", calledNumber)
        .maybeSingle();
      if (bizByNumber) {
        businessId = bizByNumber.id;
      }
    }
  }

  // If still no business, treat as main line
  if (!businessId) {
    businessId = WITALINE_MAIN_BUSINESS_ID;
  }

  const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;
  const estimatedTokens = Math.ceil((durationSeconds / 60) * 1000); // ~1000 tok/min

  // Stawka wewnętrzna/admin: ~0,65 PLN/min = 0,00065 PLN/token
  const ADMIN_COST_PER_TOKEN = 0.00065;
  const mainLineCostPln = Math.round(estimatedTokens * ADMIN_COST_PER_TOKEN * 100) / 100;
  const mainLineInternalCostPln = mainLineCostPln;

  console.log("[call-completed] processing", { businessId, isMainLine, durationSeconds, callerId });

  if (isMainLine) {
    const { data: callLog } = await supabaseAdmin
      .from("call_logs")
      .insert({
        business_id: WITALINE_MAIN_BUSINESS_ID,
        elevenlabs_conversation_id: conversationId || "",
        duration_seconds: durationSeconds,
        cost_pln: mainLineCostPln,
        internal_cost_pln: mainLineInternalCostPln,
        caller_id: callerId || "unknown",
        from_number: (metadata.from_number as string) || callerId || "",
        twilio_call_sid: (metadata.twilio_call_sid as string) || "",
        routed_from_main: true,
        transcript: transcript || "",
        classification: classifyCall(summary || "", transcript || ""),
        ai_summary: summary || "",
        was_helpful: wasHelpful ?? null,
        recording_url: recordingUrl || "",
        ended_at: new Date().toISOString(),
        tokens_input: Math.ceil(estimatedTokens * 0.4),
        tokens_output: Math.ceil(estimatedTokens * 0.6),
        tokens_total: estimatedTokens,
      })
      .select()
      .single();

  const mainClassification = classifyCall(summary || "", transcript || "");

  if (callLog) {
    const callerName = (customData.caller_name as string) || (customData.sms_contact_name as string) || "";
    await supabaseAdmin.from("conversations").insert({
      business_id: WITALINE_MAIN_BUSINESS_ID,
      channel: "voice",
      status: "ended",
      caller_id: callerId || "unknown",
      caller_name: callerName || null,
      summary: summary || "",
      duration_seconds: durationSeconds || 0,
      message_count: transcript ? transcript.split("\n").length : 1,
      started_at: new Date(Date.now() - (durationSeconds || 0) * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  }

  await addNotification({
    businessId: WITALINE_MAIN_BUSINESS_ID,
    type: "call",
    title: "Nowe połączenie",
    message: `Połączenie od ${callerId || (metadata.from_number as string) || ""}${mainClassification ? ` (${mainClassification})` : ""}${durationSeconds ? ` - ${Math.round(durationSeconds / 60)} min` : ""}`,
    metadata: { caller_id: callerId, from_number: (metadata.from_number as string) || callerId || "", classification: mainClassification, duration_seconds: durationSeconds, has_transcript: !!transcript, recording_url: recordingUrl },
  });

  if (customData.sms_consent && customData.sms_phone && (mainClassification === "booking" || mainClassification === "order")) {
      const offerKey = (customData.sms_offer as string) || "enterprise";
      const smsText = OFFER_SMS_TEXTS[offerKey] || OFFER_SMS_TEXTS.lux;
      const contactName = customData.sms_contact_name || "";

      const finalText = contactName
        ? `Cześć ${contactName}!\n\n${smsText.replace(/^Cześć.*\n\n/, "")}`
        : smsText;

      const smsResult = await sendSms(
        customData.sms_phone as string,
        finalText,
        callLog?.id,
        WITALINE_MAIN_BUSINESS_ID
      );

      console.log("[call-completed] SMS result:", smsResult);
    }

    // WhatsApp continuity — always send if wa_consent given
    if (customData.wa_consent && customData.wa_phone) {
      const callerName = (customData.caller_name as string) || (customData.sms_contact_name as string) || "";
      await sendWhatsAppContinuity(
        customData.wa_phone as string,
        mainClassification,
        callerName,
        callLog?.id,
        WITALINE_MAIN_BUSINESS_ID,
        customData,
        summary,
      );
    }

    // Outbound webhook — notify any configured endpoint
    if (callLog) {
      sendWebhook(WITALINE_MAIN_BUSINESS_ID, {
        event: "call.completed",
        call_id: callLog.id,
        caller_id: callerId || "unknown",
        from_number: (metadata.from_number as string) || callerId || "",
        duration_seconds: durationSeconds,
        classification: mainClassification,
        ai_summary: summary || "",
        transcript: transcript || "",
        recording_url: recordingUrl || "",
        was_helpful: wasHelpful ?? null,
        started_at: new Date(Date.now() - (durationSeconds || 0) * 1000).toISOString(),
        ended_at: new Date().toISOString(),
      }).catch(e => console.warn("[call-completed] webhook error:", e));
    }

    return NextResponse.json({ ok: true, callLogId: callLog?.id });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) {
    console.log("[call-completed] business not found, falling back to main line");
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (business.suspended) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const planConfig = getPlanConfig(business.current_plan as PlanKey);
  if (business.minutes_used_this_week >= planConfig.monthlyVoiceMinutes && business.current_plan !== "enterprise_2000" && business.current_plan !== "lux_599") {
    return NextResponse.json({ error: "Weekly limit exceeded" }, { status: 429 });
  }

  const costPln = calculateCost(durationSeconds, business.current_plan as PlanKey);
  const internalCostPln = Math.round(estimatedTokens * 0.00065 * 100) / 100;
  const classification = classifyCall(summary || "", transcript || "");

  const { data: callLog } = await supabaseAdmin
    .from("call_logs")
    .insert({
      business_id: businessId,
      elevenlabs_conversation_id: conversationId || "",
      duration_seconds: durationSeconds,
      cost_pln: costPln,
      internal_cost_pln: internalCostPln,
      caller_id: callerId || "unknown",
      from_number: (metadata.from_number as string) || callerId || "",
      twilio_call_sid: (metadata.twilio_call_sid as string) || "",
      routed_from_main: !!(metadata.routed_from_main),
      routed_to_extension: (metadata.routed_to_extension as string) || null,
      routed_business_name: (metadata.routed_business_name as string) || null,
      transcript: transcript || "",
      classification,
      ai_summary: summary || "",
      was_helpful: wasHelpful ?? null,
      recording_url: recordingUrl || "",
        ended_at: new Date().toISOString(),
        tokens_input: Math.ceil(estimatedTokens * 0.4),
        tokens_output: Math.ceil(estimatedTokens * 0.6),
        tokens_total: estimatedTokens,
      })
      .select()
      .single();

  const minutesToAdd = Math.ceil(durationSeconds / 60);

  if (callLog) {
    await supabaseAdmin.from("conversations").insert({
      business_id: businessId,
      channel: "voice",
      status: "ended",
      caller_id: callerId || "unknown",
      caller_name: (customData.caller_name as string) || null,
      summary: summary || "",
      duration_seconds: durationSeconds || 0,
      message_count: transcript ? transcript.split("\n").length : 1,
      started_at: new Date(Date.now() - (durationSeconds || 0) * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  }

  await addNotification({
    businessId,
    type: "call",
    title: "Nowe połączenie",
    message: `Połączenie od ${callerId || (metadata.from_number as string) || ""}${classification ? ` (${classification})` : ""}${durationSeconds ? ` - ${Math.round(durationSeconds / 60)} min` : ""}`,
    metadata: { caller_id: callerId, from_number: (metadata.from_number as string) || callerId || "", classification, duration_seconds: durationSeconds, has_transcript: !!transcript, recording_url: recordingUrl },
  });

  const currentTokensUsed = business.tokens_used_this_month || 0;
  const currentPrepaid = parseFloat(business.prepaid_minutes || "0");
  const newPrepaid = currentPrepaid > 0 ? Math.max(0, Math.round((currentPrepaid - minutesToAdd) * 100) / 100) : currentPrepaid;

  await supabaseAdmin
    .from("businesses")
    .update({
      minutes_used_this_week: business.minutes_used_this_week + minutesToAdd,
      tokens_used_this_month: currentTokensUsed + estimatedTokens,
      prepaid_minutes: newPrepaid,
    })
    .eq("id", businessId);

  const reservation = extractReservation(customData);
  if (reservation && callLog) {
    await supabaseAdmin.from("reservations").insert({
      business_id: businessId,
      call_log_id: callLog.id,
      ...reservation,
    });
  }

  const feedback = extractFeedback(customData);
  if (feedback) {
    await supabaseAdmin.from("feedback").insert({
      business_id: businessId,
      call_log_id: callLog?.id || null,
      ...feedback,
    });
  }

  // WhatsApp continuity for external business calls
  if (customData.wa_consent && customData.wa_phone) {
    const callerName = (customData.caller_name as string) || "";
    await sendWhatsAppContinuity(
      customData.wa_phone as string,
      classification,
      callerName,
      callLog?.id,
      businessId,
      customData,
      summary,
    );
  }

  // Outbound webhook — notify business endpoint
  if (callLog) {
    sendWebhook(businessId, {
      event: "call.completed",
      call_id: callLog.id,
      caller_id: callerId || "unknown",
      from_number: (metadata.from_number as string) || callerId || "",
      duration_seconds: durationSeconds,
      classification,
      ai_summary: summary || "",
      transcript: transcript || "",
      recording_url: recordingUrl || "",
      was_helpful: wasHelpful ?? null,
      started_at: new Date(Date.now() - (durationSeconds || 0) * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    }).catch(e => console.warn("[call-completed] webhook error:", e));
  }

  return NextResponse.json({ ok: true });
}