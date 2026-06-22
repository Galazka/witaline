import { supabaseAdmin } from "@/lib/supabase-admin";

const WHATSAPP_SANDBOX_NUMBER = "+14155238886";

// Use configured WhatsApp sender from env, or fall back to sandbox
// TWILIO_PHONE_NUMBER is intentionally NOT used here — it's for voice/SMS,
// and most numbers are not WhatsApp-registered (error 63007).
// Set TWILIO_WHATSAPP_FROM explicitly for production WhatsApp.
function getWhatsAppFrom(): string {
  const configured = process.env.TWILIO_WHATSAPP_FROM;
  if (configured) return configured;
  console.warn("[twilio-whatsapp] TWILIO_WHATSAPP_FROM not set, using sandbox. Set TWILIO_WHATSAPP_FROM for production WhatsApp.");
  return WHATSAPP_SANDBOX_NUMBER;
}

function getTwilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

export async function sendWhatsApp(
  toNumber: string,
  messageBody: string,
  mediaUrl?: string,
  callLogId?: string,
  businessId?: string
): Promise<{ success: boolean; twilioSid?: string; error?: string }> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) return { success: false, error: "TWILIO_PHONE_NUMBER not set" };

  let waUsed = 0;

  if (businessId) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("wa_limit, wa_used, wa_extra_purchased")
      .eq("id", businessId)
      .single();

    if (biz) {
      const total = (biz.wa_limit || 0) + (biz.wa_extra_purchased || 0);
      const used = biz.wa_used || 0;
      waUsed = used;
      if (used >= total) {
        await logWhatsApp(toNumber, messageBody, "failed", callLogId, businessId, undefined, "Limit WhatsApp wyczerpany");
        return { success: false, error: "Limit WhatsApp wyczerpany" };
      }
    }
  }

  const normalized = toNumber.startsWith("+") ? toNumber : `+${toNumber}`;
  // Ensure Polish number has correct format for WhatsApp
  const waTo = `whatsapp:${normalized}`;
  const waFrom = `whatsapp:${getWhatsAppFrom()}`;

  try {
    const form = new URLSearchParams({ To: waTo, From: waFrom, Body: messageBody });
    if (mediaUrl) form.append("MediaUrl", mediaUrl);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${getTwilioAuth()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.message || data.error_message || "Twilio WhatsApp API error";
      await logWhatsApp(toNumber, messageBody, "failed", callLogId, businessId, undefined, errMsg);
      return { success: false, error: errMsg, twilioSid: data.sid };
    }

    await logWhatsApp(toNumber, messageBody, data.status || "sent", callLogId, businessId, data.sid);

    if (businessId) {
      const { error: rpcErr } = await supabaseAdmin.rpc("increment_wa_used", { biz_id: businessId });
      if (rpcErr) {
        await supabaseAdmin
          .from("businesses")
          .update({ wa_used: waUsed + 1 })
          .eq("id", businessId);
      }
    }

    return { success: true, twilioSid: data.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

async function logWhatsApp(
  toNumber: string,
  messageBody: string,
  status: string,
  callLogId?: string,
  businessId?: string,
  twilioSid?: string,
  errorMessage?: string
) {
  await supabaseAdmin.from("wa_logs").insert({
    business_id: businessId || null,
    call_log_id: callLogId || null,
    to_number: toNumber,
    message_body: messageBody,
    status,
    twilio_sid: twilioSid || null,
    error_message: errorMessage || null,
    sent_at: status === "failed" ? null : new Date().toISOString(),
  });
}

export const WHATSAPP_CONTINUITY_TEMPLATES = {
  booking: (name: string, date: string, time: string, service: string) =>
    `Cześć ${name}! ✅ Potwierdzam wizytę:\n📅 ${date}\n⏰ ${time}\n💇 ${service}\n\nMasz pytania? Odpisz na ten WhatsApp — jesteśmy tu dla Ciebie! 🙌`,

  order: (name: string, summary: string, paymentLink?: string) =>
    `Cześć ${name}! Dziękujemy za zamówienie 🎯\n\n${summary}${paymentLink ? `\n\n🔗 Opłać tutaj: ${paymentLink}` : ""}\n\nOdpisz na tego WhatsApp, jeśli masz pytania!`,

  offer: (name: string, planName: string, price: string, paymentLink?: string) =>
    `Cześć ${name}! Dziękujemy za rozmowę z WitaLine 🎯\n\nOferta ${planName}: ${price}/mies\n✨ Bot AI 24/7\n✨ Transkrypcje\n✨ Panel zarządzania\n${paymentLink ? `\n🔗 Aktywuj: ${paymentLink}` : "\n👉 Więcej: https://witaline.pl/cennik"}\n\nOdpisz na tego WhatsApp — oddzwonimy w 15 minut!`,

  payment_reminder: (name: string, paymentLink: string, amount: string) =>
    `Cześć ${name}! ⏰ Przypomnienie o płatności\n\nKwota: ${amount}\n🔗 Opłać: ${paymentLink}\n\nMasz pytania? Odpisz na tego WhatsApp!`,

  default: (name: string) =>
    `Cześć ${name}! Dziękujemy za rozmowę z WitaLine 🎯\n\nJeśli masz pytania, odpisz na tego WhatsApp — jesteśmy tu dla Ciebie!`,
};
