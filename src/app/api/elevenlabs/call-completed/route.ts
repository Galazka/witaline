import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateCost, getPlanConfig } from "@/lib/pricing";
import { sendSms } from "@/lib/twilio-sms";
import { addNotification } from "@/lib/notifications";
import { sendWebhook } from "@/lib/webhook-outbound";
import { enqueueJob } from "@/lib/job-queue";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { analyzeCall } from "@/lib/analyze-call";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

function verifyWebhook(request: Request): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = request.headers.get("elevenlabs-webhook-secret") || request.headers.get("x-elevenlabs-webhook-secret") || request.headers.get("webhook-secret");
  if (sig !== secret) {
    console.warn("[call-completed] webhook secret mismatch — rejecting");
    return false;
  }
  return true;
}

type Classification = "spam" | "offer" | "order" | "question" | "booking" | "unknown";

function classifyCall(summary: string, transcript: string): Classification {
  const text = `${summary} ${transcript}`.toLowerCase();
  if (/\b(reklama|spam|sprzeda|oferta komerc|nie interes|pomyłka|wrong number)\b/.test(text)) return "spam";
  if (/\b(zamów|zamowie|chce kupić|poprosze|rezerw|umów|wizyt|termin|booking|order|chciałbym zamówić)\b/.test(text)) return "booking";
  if (/\b(cena|ile kosztuje|promoc|zniżk|pakiet|start|pro|growth|enterprise|abonament|płatnoś|faktur|za ile|drogo|tanio)\b/.test(text)) return "offer";
  if (/\b(pytanie|pytam|chciałem zapytać|inform|jak działa|czy mogę|help|porad|dlaczego|gdzie|kiedy|jak|co to)\b/.test(text)) return "question";
  return "unknown";
}

const OFFER_SMS_TEXTS: Record<string, string> = {
  elastic: `Cześć! Dziękujemy za rozmowę z WitaLine. Oferta elastyczna: 0 zł/mies, płacisz tylko za minuty. Sprawdź widełki cenowe: https://witaline.pl/oferta-indywidualna`,
  pro: `Cześć! Dziękujemy za rozmowę z WitaLine. Oferta elastyczna: 0 zł/mies, płacisz tylko za minuty. Sprawdź widełki cenowe: https://witaline.pl/oferta-indywidualna`,
  lux: `Cześć! Dziękujemy za rozmowę z WitaLine. Oferta elastyczna: 0 zł/mies, płacisz tylko za minuty. Sprawdź widełki cenowe: https://witaline.pl/oferta-indywidualna`,
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

function parseBody(body: Record<string, unknown>) {
  if (body.type === "post_call_transcription") {
    const d = body.data as Record<string, unknown> | undefined;
    if (!d) return null;
    const meta = (d.metadata as Record<string, unknown>) || {};
    const analysis = (d.analysis as Record<string, unknown>) || {};
    const initData = (d.conversation_initiation_client_data as Record<string, unknown>) || {};
    const dynVars = (initData.dynamic_variables as Record<string, unknown>) || {};
    const rawTranscript = d.transcript as Array<Record<string, unknown>> | undefined;
    const transcriptText = rawTranscript ? rawTranscript.map((t: any) => `[${t.role}] ${t.message}`).join("\n") : "";
    return {
      conversationId: (d.conversation_id as string) || "",
      agentId: (d.agent_id as string) || "",
      callerId: (d.caller_id as string) || (meta.caller_id as string) || (dynVars.from_number as string) || "",
      durationSeconds: (d.duration_seconds as number) || (meta.call_duration_secs as number) || 0,
      transcript: transcriptText || "",
      summary: (analysis.transcript_summary as string) || "",
      wasHelpful: null,
      metadata: { ...meta, ...dynVars },
      customData: {},
      recordingUrl: (d.recording_url as string) || "",
    };
  }
  const conversationId = (body.conversation_id as string) || "";
  const agentId = (body.agent_id as string) || "";
  if (!conversationId && !agentId) return null;
  return {
    conversationId,
    agentId,
    callerId: (body.caller_id as string) || "",
    durationSeconds: (body.duration_seconds as number) || 0,
    transcript: (body.transcript as string) || "",
    summary: (body.summary as string) || "",
    wasHelpful: (body.was_helpful as boolean) ?? null,
    metadata: (body.metadata as Record<string, unknown>) || {},
    customData: (() => {
      const raw = body.custom_data;
      if (typeof raw === "string") try { return JSON.parse(raw); } catch { return {}; }
      return (raw as Record<string, unknown>) || {};
    })(),
    recordingUrl: (body.recording_url as string) || "",
  };
}

export async function POST(request: Request) {
  // Rate limit: 60 requests per minute
  const ip = request.headers.get("x-forwarded-for") || "call-completed";
  const rl = rateLimitMiddleware(`elevenlabs-call-completed:${ip}`, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rl.headers });
  }

  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[call-completed] received payload type:", raw.type);

  const parsed = parseBody(raw);
  if (!parsed) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const { conversationId, callerId, durationSeconds, transcript, summary, wasHelpful, metadata, customData, recordingUrl } = parsed;

  let businessId = (metadata.businessId as string) || "";
  if (!businessId) {
    const calledNumber = (metadata.called_number as string) || (metadata.to_number as string) || "";
    if (calledNumber) {
      const { data: bizByNumber } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("twilio_number", calledNumber)
        .maybeSingle();
      if (bizByNumber) businessId = bizByNumber.id;
    }
  }
  if (!businessId) businessId = WITALINE_MAIN_BUSINESS_ID;

  const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;
  const estimatedTokens = Math.ceil((durationSeconds / 60) * 1000);
  const ADMIN_COST_PER_TOKEN = 0.00065;
  const mainLineCostPln = Math.round(estimatedTokens * ADMIN_COST_PER_TOKEN * 100) / 100;

  // Enqueue async job for non-critical processing
  enqueueJob(isMainLine ? "call_completed_main" : "call_completed_client", {
    businessId,
    callerId,
    durationSeconds,
    transcript,
    summary,
    classification: classifyCall(summary || "", transcript || ""),
    conversationId,
    recordingUrl,
    wasHelpful,
    estimatedTokens,
    customData: customData as Record<string, unknown>,
    metadata: metadata as Record<string, unknown>,
    currentPlan: isMainLine ? "main" : (await supabaseAdmin.from("businesses").select("current_plan, minutes_used_this_week").eq("id", businessId).maybeSingle())?.data?.current_plan || "start_100",
    minutesUsed: isMainLine ? 0 : (await supabaseAdmin.from("businesses").select("current_plan, minutes_used_this_week").eq("id", businessId).maybeSingle())?.data?.minutes_used_this_week || 0,
  }).catch((e) => console.error("[call-completed] notify error:", e));

  if (isMainLine) {
    const classification = classifyCall(summary || "", transcript || "");
    const { data: callLog } = await supabaseAdmin
      .from("call_logs")
      .insert({
        business_id: WITALINE_MAIN_BUSINESS_ID,
        elevenlabs_conversation_id: conversationId || "",
        duration_seconds: durationSeconds,
        cost_pln: mainLineCostPln,
        internal_cost_pln: mainLineCostPln,
        caller_id: callerId || "unknown",
        from_number: (metadata.from_number as string) || callerId || "",
        twilio_call_sid: (metadata.twilio_call_sid as string) || "",
        routed_from_main: true,
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

    if (callLog) {
      analyzeCall(transcript || "", summary || "", callLog.id).catch((e) => console.error("[call-completed] analyze error:", e));

      await supabaseAdmin.from("conversations").insert({
        business_id: WITALINE_MAIN_BUSINESS_ID,
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
      businessId: WITALINE_MAIN_BUSINESS_ID,
      type: "call",
      title: "Nowe połączenie",
      message: `Połączenie od ${callerId || (metadata.from_number as string) || ""}${classification ? ` (${classification})` : ""}${durationSeconds ? ` - ${Math.round(durationSeconds / 60)} min` : ""}`,
      metadata: { caller_id: callerId, from_number: (metadata.from_number as string) || callerId || "", classification, duration_seconds: durationSeconds, has_transcript: !!transcript, recording_url: recordingUrl },
    });

    if (customData.sms_consent && customData.sms_phone && (classification === "booking" || classification === "order")) {
      const offerKey = (customData.sms_offer as string) || "lux";
      const smsText = OFFER_SMS_TEXTS[offerKey] || OFFER_SMS_TEXTS.lux;
      const contactName = customData.sms_contact_name || "";
      const finalText = contactName ? `Cześć ${contactName}!\n\n${smsText.replace(/^Cześć.*\n\n/, "")}` : smsText;
      await sendSms(customData.sms_phone as string, finalText, callLog?.id, WITALINE_MAIN_BUSINESS_ID);
    }

    if (callLog) {
      sendWebhook(WITALINE_MAIN_BUSINESS_ID, {
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

    return NextResponse.json({ ok: true, callLogId: callLog?.id });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (business.suspended) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  // Detect first ever call for this business → send congratulations email
  const { count: existingCallCount } = await supabaseAdmin
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const isFirstCall = existingCallCount === 0 || (existingCallCount === 1 && metadata.twilio_call_sid);
  if (isFirstCall && business.owner_email) {
    const { sendFirstCallEmail } = await import("@/lib/email");
    sendFirstCallEmail(business.owner_email, business.name || "Firma", durationSeconds).catch(e =>
      console.error("[call-completed] first-call email error:", e)
    );
  }
  const TRIAL_MAX_MINUTES = 15;

  if (business.subscription_status === "trialing") {
    const trialExpired = business.trial_ends_at && new Date(business.trial_ends_at) < new Date();
    const trialMinutesExceeded = (business.trial_minutes_used || 0) >= TRIAL_MAX_MINUTES;
    if (trialExpired || trialMinutesExceeded) {
      return NextResponse.json({ error: trialExpired ? "Trial expired" : "Trial minute limit reached" }, { status: 402 });
    }
  }

  const planConfig = getPlanConfig(business.current_plan);

  // Block non-elastic plans that exceed their monthly limit
  if (business.current_plan !== "elastic_0" && business.current_plan !== "enterprise_2000") {
    if (business.minutes_used_this_week >= planConfig.monthlyVoiceMinutes) {
      return NextResponse.json({ error: "Limit exceeded" }, { status: 429 });
    }
  }

  const costPln = calculateCost(durationSeconds, business.current_plan);
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
      revenue_pln: costPln,
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
    analyzeCall(transcript || "", summary || "", callLog.id).catch((e) => console.error("[call-completed] analyze error:", e));

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

  const currentPrepaid = parseFloat(business.prepaid_minutes || "0");
  const newPrepaid = currentPrepaid > 0 ? Math.round((currentPrepaid - minutesToAdd) * 100) / 100 : currentPrepaid;

  const updateData: Record<string, unknown> = {
    minutes_used_this_week: (business.minutes_used_this_week || 0) + minutesToAdd,
    tokens_used_this_month: (business.tokens_used_this_month || 0) + estimatedTokens,
    prepaid_minutes: newPrepaid,
  };

  // Track trial usage separately for abuse prevention
  if (business.subscription_status === "trialing") {
    const oldTrialMinutes = business.trial_minutes_used || 0;
    const newTrialMinutes = oldTrialMinutes + minutesToAdd;
    updateData.trial_minutes_used = newTrialMinutes;
    // Send warning email when crossing 80% threshold (12 of 15 min)
    const WARNING_THRESHOLD = 12;
    if (oldTrialMinutes < WARNING_THRESHOLD && newTrialMinutes >= WARNING_THRESHOLD) {
      const { sendTrialMinuteWarningEmail } = await import("@/lib/email");
      if (business.owner_email) {
        sendTrialMinuteWarningEmail(business.owner_email, business.name || "Firma", Math.ceil(newTrialMinutes), 15).catch(e =>
          console.error("[call-completed] trial warning email error:", e)
        );
      }
    }
  }

  await supabaseAdmin
    .from("businesses")
    .update(updateData)
    .eq("id", businessId);

  // Auto-topup: if balance below threshold, trigger immediately
  if (business.auto_topup_enabled) {
    const { executeAutoTopup } = await import("@/lib/auto-topup");
    executeAutoTopup(businessId, { ...business, ...updateData }).catch((e: any) =>
      console.error("[call-completed] auto-topup error:", e)
    );
  }

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

  const { data: updatedBiz } = await supabaseAdmin
    .from("businesses")
    .select("prepaid_minutes, sms_limit, sms_used, sms_extra_purchased, owner_uid")
    .eq("id", businessId)
    .maybeSingle();

  if (updatedBiz) {
    const remainingMins = parseFloat(updatedBiz.prepaid_minutes || "0");
    const smsRemaining = Math.max(0, (updatedBiz.sms_limit || 0) + (updatedBiz.sms_extra_purchased || 0) - (updatedBiz.sms_used || 0));

    if (remainingMins < 50 || smsRemaining < 20) {
      const parts: string[] = [];
      if (remainingMins < 20) parts.push("Krytycznie niskie saldo minut!");
      else if (remainingMins < 50) parts.push("Pozostało mało minut.");
      if (smsRemaining < 10) parts.push("Krytycznie niskie saldo SMS!");
      else if (smsRemaining < 20) parts.push("Pozostało mało SMS.");

      addNotification({
        businessId,
        type: "system",
        title: "Niskie saldo",
        message: parts.join(" ") + " Doładuj konto aby uniknąć przerwy w obsłudze.",
      }).catch(e => console.warn("[call-completed] notify error:", e));
    }
  }

  return NextResponse.json({ ok: true, callLogId: callLog?.id });
}
