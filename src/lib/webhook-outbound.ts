import { supabaseAdmin } from "./supabase-admin";

type WebhookEvent = "call.completed" | "lead.created" | "reservation.created";

interface CallCompletedPayload {
  event: "call.completed";
  call_id: string;
  caller_id: string;
  from_number: string;
  duration_seconds: number;
  classification: string;
  ai_summary: string;
  transcript: string;
  recording_url: string;
  was_helpful: boolean | null;
  started_at: string;
  ended_at: string;
}

interface LeadCreatedPayload {
  event: "lead.created";
  lead_id: string;
  caller_name?: string;
  caller_phone?: string;
  source: string;
  notes: string;
  created_at: string;
}

interface ReservationCreatedPayload {
  event: "reservation.created";
  reservation_id: string;
  caller_name: string;
  caller_phone: string;
  service_type: string;
  reserved_at: string;
  duration_minutes: number;
  notes: string;
}

type WebhookPayload = CallCompletedPayload | LeadCreatedPayload | ReservationCreatedPayload;

export async function sendWebhook(
  businessId: string,
  payload: WebhookPayload,
): Promise<{ success: boolean; status?: number }> {
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("webhook_url, webhook_secret")
    .eq("id", businessId)
    .single();

  if (!biz?.webhook_url) return { success: false };

  const url = biz.webhook_url;
  const secret = biz.webhook_secret || "";
  const body = JSON.stringify(payload);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "WitaLine-Webhook/1.0",
        "X-WitaLine-Signature": await createSignature(secret, body),
        "X-WitaLine-Event": payload.event,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    const duration = Date.now() - start;
    const responseText = await res.text().catch(() => "");

    await supabaseAdmin.from("webhook_logs").insert({
      business_id: businessId,
      event: payload.event,
      url,
      status: res.status,
      response_body: responseText.slice(0, 1000),
      duration_ms: duration,
      success: res.status >= 200 && res.status < 300,
    });

    return { success: res.status >= 200 && res.status < 300, status: res.status };
  } catch (err: any) {
    const duration = Date.now() - start;

    await supabaseAdmin.from("webhook_logs").insert({
      business_id: businessId,
      event: payload.event,
      url,
      status: 0,
      response_body: err.message?.slice(0, 1000) || "timeout/network error",
      duration_ms: duration,
      success: false,
    });

    return { success: false };
  }
}

async function createSignature(secret: string, body: string): Promise<string> {
  if (!secret) return "unsigned";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}
