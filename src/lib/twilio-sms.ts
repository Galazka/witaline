import { supabaseAdmin } from "@/lib/supabase-admin";

function getTwilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

export async function sendSms(
  toNumber: string,
  messageBody: string,
  callLogId?: string,
  businessId?: string
): Promise<{ success: boolean; twilioSid?: string; error?: string }> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) return { success: false, error: "TWILIO_PHONE_NUMBER not set" };

  let smsUsed = 0;

  if (businessId) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("sms_limit, sms_used, sms_extra_purchased")
      .eq("id", businessId)
      .single();

    if (biz) {
      const total = (biz.sms_limit || 0) + (biz.sms_extra_purchased || 0);
      const used = biz.sms_used || 0;
      smsUsed = used;
      if (used >= total) {
        await logSms(toNumber, messageBody, "failed", callLogId, businessId, undefined, "Limit SMS wyczerpany");
        return { success: false, error: "Limit SMS wyczerpany — brak dostępnych SMS-ów." };
      }
    }
  }

  try {
    const form = new URLSearchParams({
      To: toNumber.startsWith("+") ? toNumber : `+${toNumber}`,
      From: fromNumber,
      Body: messageBody,
    });

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
      const errMsg = data.message || data.error_message || "Twilio API error";
      await logSms(toNumber, messageBody, "failed", callLogId, businessId, undefined, errMsg);
      return { success: false, error: errMsg, twilioSid: data.sid };
    }

    await logSms(toNumber, messageBody, data.status || "sent", callLogId, businessId, data.sid);

    if (businessId) {
      const { error: rpcErr } = await supabaseAdmin.rpc("increment_sms_used", { biz_id: businessId });
      if (rpcErr) {
        // Fallback: direct update if RPC doesn't exist yet
        await supabaseAdmin
          .from("businesses")
          .update({ sms_used: smsUsed + 1 })
          .eq("id", businessId);
      }
    }

    return { success: true, twilioSid: data.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

async function logSms(
  toNumber: string,
  messageBody: string,
  status: string,
  callLogId?: string,
  businessId?: string,
  twilioSid?: string,
  errorMessage?: string
) {
  await supabaseAdmin.from("sms_logs").insert({
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
