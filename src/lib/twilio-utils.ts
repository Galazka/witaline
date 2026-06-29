import { NextResponse } from "next/server";
import * as https from "https";
import { setActiveCallSid } from "@/lib/active-call-store";
import { setConversationForCall } from "@/lib/conversation-store";
import { getTwilioCredentials, getTwilioAuthFromCreds } from "@/lib/twilio-credentials";
import type { TwilioCredentials } from "@/lib/twilio-credentials";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function twiml(content: string): Response {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, { status: 200, headers: { "Content-Type": "application/xml" } });
}

export function twimlDocument(content: string): string {
  const trimmed = content.trim();
  if (/^<\?xml[\s\S]*<Response\b/i.test(trimmed) || /^<Response\b/i.test(trimmed)) return trimmed;
  return `<Response>${content}</Response>`;
}

async function resolveCreds(businessId?: string): Promise<TwilioCredentials> {
  return getTwilioCredentials(businessId);
}

function twilioApiRequest(method: "GET" | "POST", path: string, creds: TwilioCredentials, body?: URLSearchParams): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const auth = getTwilioAuthFromCreds(creds);
    const hasBody = !!body;
    const payload = hasBody ? body.toString() : null;
    const headers: Record<string, string> = { Authorization: `Basic ${auth}` };
    if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (payload) headers["Content-Length"] = String(Buffer.byteLength(payload));
    const req = https.request({ method, hostname: "api.twilio.com", path, headers }, (res) => {
      let d = "";
      res.on("data", (chunk) => (d += chunk));
      res.on("end", () => { try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, data: d }); } });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export function registerCall(fromNumber: string, toNumber: string, businessId?: string, callSid?: string, trialMinutesRemaining?: number, prepaidMinutesRemaining?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const dynVars: Record<string, string | undefined> = { business_id: businessId || WITALINE_MAIN_BUSINESS_ID, caller_number: fromNumber, call_sid: callSid || "" };
    if (trialMinutesRemaining !== undefined && trialMinutesRemaining >= 0) {
      dynVars.trial_minutes_remaining = String(trialMinutesRemaining);
    }
    if (prepaidMinutesRemaining !== undefined && prepaidMinutesRemaining > 0) {
      dynVars.minutes_remaining = String(prepaidMinutesRemaining);
    }
    const body = JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      from_number: fromNumber, to_number: toNumber, direction: "inbound",
      dynamic_vars: businessId ? { business_id: businessId, call_sid: callSid || undefined, caller_phone: fromNumber || undefined, to_number: toNumber || undefined, trial_minutes_remaining: trialMinutesRemaining !== undefined ? String(trialMinutesRemaining) : undefined, minutes_remaining: prepaidMinutesRemaining !== undefined ? String(prepaidMinutesRemaining) : undefined } : undefined,
      conversation_initiation_client_data: { dynamic_variables: dynVars }
    });
    const req = https.request({ method: "POST", hostname: "api.elevenlabs.io", path: "/v1/convai/twilio/register-call", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "xi-api-key": process.env.ELEVENLABS_API_KEY } }, (res) => {
      let d = "";
      res.on("data", (chunk) => (d += chunk));
      res.on("end", () => { if (res.statusCode !== 200) reject(new Error(`${res.statusCode}: ${d}`)); else resolve(d); });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

export function registerTransferFallback(fromNumber: string, toNumber: string, businessId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      from_number: fromNumber, to_number: toNumber, direction: "inbound",
      dynamic_vars: {
        business_id: businessId,
        caller_phone: fromNumber,
        to_number: toNumber,
        transfer_failed: "true",
      },
      conversation_initiation_client_data: {
        dynamic_variables: {
          business_id: businessId,
          caller_number: fromNumber,
          transfer_failed: "true",
        }
      }
    });
    const req = https.request({ method: "POST", hostname: "api.elevenlabs.io", path: "/v1/convai/twilio/register-call", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "xi-api-key": process.env.ELEVENLABS_API_KEY } }, (res) => {
      let d = "";
      res.on("data", (chunk) => (d += chunk));
      res.on("end", () => { if (res.statusCode !== 200) reject(new Error(`${res.statusCode}: ${d}`)); else resolve(d); });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

export async function connectToAgent(systemPrompt: string | null, name: string, businessId: string, callSid: string, fromNumber: string, toNumber: string, voiceId?: string, voiceName?: string, baseUrlOverride?: string, trialMinutesRemaining?: number, prepaidMinutesRemaining?: number): Promise<Response> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) return twiml(`<Say language="pl-PL">Asystent AI jest w trakcie konfigucji. Prosimy spróbować później.</Say><Hangup/>`);
  await setActiveCallSid(businessId, callSid);
  try {
    const xml = await registerCall(fromNumber, toNumber, businessId, callSid, trialMinutesRemaining, prepaidMinutesRemaining);
    console.log("[connectToAgent] ElevenLabs response XML (first 500):", xml.substring(0, 500));
    const convIdMatch = xml.match(/name="conversation_id"\s+value="([^"]+)"/);
    if (!convIdMatch) throw new Error("No conversation_id in ElevenLabs response");
    const conversationId = convIdMatch[1];
    setConversationForCall(callSid, conversationId, businessId);
    const baseUrl = baseUrlOverride || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || "http://localhost:3000";
    const cleanUrl = baseUrl.replace(/\/+$/, "");
    const redirectUrl = `${cleanUrl}/api/twilio/transfer-router?callSid=${encodeURIComponent(callSid)}&businessId=${encodeURIComponent(businessId)}&fromNumber=${encodeURIComponent(fromNumber)}&toNumber=${encodeURIComponent(toNumber)}`;
    // Inject <Redirect> immediately after </Connect> so it fires when stream ends
    let wrapper = xml;
    if (wrapper.includes("</Connect>")) {
      wrapper = wrapper.replace("</Connect>", `</Connect><Redirect method="POST">${escapeXml(redirectUrl)}</Redirect>`);
    } else {
      // Fallback: inject before </Response> (last resort)
      console.warn("[connectToAgent] </Connect> not found in ElevenLabs response - using fallback injection");
      wrapper = wrapper.replace("</Response>", `<Redirect method="POST">${escapeXml(redirectUrl)}</Redirect></Response>`);
    }
    return new NextResponse(wrapper, { status: 200, headers: { "Content-Type": "application/xml" } });
  } catch (err) { console.error("[connectToAgent] register-call failed:", err instanceof Error ? err.message : String(err)); }
  return twiml(`<Say language="pl-PL">Przepraszamy, wystąpił problem z połączeniem. Proszę spróbować później.</Say><Hangup/>`);
}

export async function dialConsultantToConference(targetNumber: string, callerId: string, conferenceName: string, baseUrl: string, businessId: string, callSid: string): Promise<{ ok: boolean; sid?: string; message: string }> {
   let creds: TwilioCredentials;
   try { creds = await resolveCreds(businessId); } catch { return { ok: false, message: "Twilio credentials not configured" }; }

   const recordingCallbackUrl = `${baseUrl}/api/twilio/recording-callback?callSid=${encodeURIComponent(callSid)}&businessId=${encodeURIComponent(businessId)}`;
   const consulTwiml = `<Response><Dial record="record-from-answer-dual" recordingStatusCallback="${escapeXml(recordingCallbackUrl)}" recordingStatusCallbackEvent="completed"><Conference>${escapeXml(conferenceName)}</Conference></Dial><Say language="pl-PL">Połączenie z konsultantem nie powiodło się. Przepraszamy.</Say><Hangup/></Response>`;
   const statusCallback = `${baseUrl}/api/twilio/dial-status?callSid=${encodeURIComponent(callSid)}&conference=${encodeURIComponent(conferenceName)}&businessId=${encodeURIComponent(businessId)}`;

   console.log("[dialConsultantToConference] Preparing to dial consultant:", targetNumber, "conferenceName:", conferenceName, "callSid:", callSid, "callerId:", callerId);

   const body = new URLSearchParams({
     To: targetNumber,
     From: callerId,
     Twiml: consulTwiml,
     Timeout: "25",
     StatusCallback: statusCallback,
     StatusCallbackEvent: "initiated+ringing+answered+completed",
   });

   const res = await twilioApiRequest("POST", `/2010-04-01/Accounts/${creds.accountSid}/Calls.json`, creds, body);
   if (res.status >= 200 && res.status < 300) {
     const data = res.data as { sid?: string; status?: string };
     console.log("[dialConsultantToConference] call created:", data?.sid, "status:", data?.status, "target:", targetNumber, "conferenceName:", conferenceName);
     if (!["queued", "in-progress", "ringing"].includes((data?.status || "").toLowerCase())) {
       console.warn("[dialConsultantToConference] Unexpected Twilio call status:", data?.status, "target:", targetNumber);
     }
     return { ok: true, sid: data?.sid, message: "Consultant dialed to conference" };
   }
   console.error("[dialConsultantToConference] failed:", res.status, typeof res.data === "string" ? res.data.slice(0, 200) : JSON.stringify(res.data).slice(0, 200));
   return { ok: false, message: typeof res.data === "string" ? res.data : res.data?.message || "Dial failed" };
}

export async function redirectCallWithTransferTwiML(callSid: string, targetNumber: string, callerId: string, baseUrl: string, businessId: string, idx: number): Promise<{ ok: boolean; status?: number; message: string }> {
  const cleanUrl = baseUrl.replace(/\/+$/, "");
  const queueName = `handoff_${callSid}`;
  const holdUrl = `${cleanUrl}/api/twilio/hold-music`;
  const actionUrl = `${cleanUrl}/api/twilio/human-handoff/next?businessId=${encodeURIComponent(businessId)}&callSid=${encodeURIComponent(callSid)}`;

  const twimlBody = `
<Enqueue waitUrl="${escapeXml(holdUrl)}" action="${escapeXml(actionUrl)}" method="POST">
  ${escapeXml(queueName)}
</Enqueue>
<Redirect method="POST">${escapeXml(`${cleanUrl}/api/twilio/transfer-fallback?businessId=${encodeURIComponent(businessId)}`)}</Redirect>
<Hangup/>`;

  const result = await redirectActiveCallToHumanHandoff(callSid, twimlBody, businessId);

  if (result.ok) {
    dialConsultantToQueue(targetNumber, callerId, queueName, cleanUrl, businessId, callSid)
      .catch(err => console.error("[redirectCallWithTransferTwiML] dial consultant failed:", err));
  }

  return result;
}

export async function redirectCallToVoicemail(callSid: string, businessId: string, baseUrl: string): Promise<{ ok: boolean; status?: number; message: string }> {
  const cleanUrl = baseUrl.replace(/\/+$/, "");
  const voicemailUrl = `${cleanUrl}/api/twilio/voicemail?businessId=${encodeURIComponent(businessId)}`;
  const twimlBody = `
<Say language="pl-PL">Przepraszamy, konsultant jest obecnie niedostępny. Może Pan/Pani zostawić wiadomość po sygnale.</Say>
<Redirect method="POST">${escapeXml(voicemailUrl)}</Redirect>`;
  return redirectActiveCallToHumanHandoff(callSid, twimlBody, businessId);
}

export async function redirectActiveCallToHumanHandoff(callSid: string, twimlBody: string, businessId?: string): Promise<{ ok: boolean; status?: number; message: string }> {
  let creds: TwilioCredentials;
  try { creds = await resolveCreds(businessId); } catch { return { ok: false, message: "Twilio credentials not configured" }; }
  const body = new URLSearchParams({ Twiml: twimlDocument(twimlBody) });
  const res = await twilioApiRequest("POST", `/2010-04-01/Accounts/${creds.accountSid}/Calls/${callSid}.json`, creds, body);
  if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, message: "Call redirected to human handoff" };
  return { ok: false, status: res.status, message: typeof res.data === "string" ? res.data : res.data?.message || "Twilio redirect failed" };
}

export function humanHandoffTwiML(targetNumber: string, callerId: string, businessName: string, reason = "human"): Response {
  return twiml(humanHandoffTwiMLString(targetNumber, callerId, businessName, reason));
}

export function humanHandoffTwiMLString(targetNumber: string, callerId: string, businessName: string, reason = "human", baseUrlOverride?: string): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const safeBusiness = escapeXml(businessName);
  const baseUrl = (baseUrlOverride || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || "http://localhost:3000").replace(/\/+$/, "");
  const statusCallback = `${baseUrl}/api/twilio/human-handoff-status`;
  const reasonText = reason === "dtmf" ? "Naciśnięto 0." : "Klient poprosił o konsultanta.";
  return `<Say language="pl-PL">Przekazuję połączenie do konsultanta firmy ${safeBusiness}. ${reasonText} Proszę czekać.</Say><Say language="pl-PL">Rozmowa z konsultantem może być nagrywana i analizowana w celu poprawy jakości obsługi.</Say><Dial callerId="${safeCallerId}" timeout="25" record="record-from-answer" statusCallback="${statusCallback}" statusCallbackEvent="completed"><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Konsultant obecnie nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}

export function humanHandoffHuntTwiML(targetNumber: string, callerId: string, businessName: string, businessId: string, idx: number, total: number, baseUrlOverride?: string, includeStatusCallback?: boolean): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const safeBusiness = escapeXml(businessName);
  const baseUrl = (baseUrlOverride || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || "http://localhost:3000").replace(/\/+$/, "");
  const statusCallbackUrl = includeStatusCallback ? `${baseUrl}/api/twilio/human-handoff-status` : "";
  const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${businessId}&idx=${idx}`;
  const reasonText = idx === 0 ? "Klient poprosił o konsultanta." : "";
  return `<Say language="pl-PL">${reasonText ? reasonText + " " : ""}Proszę czekać.</Say><Dial callerId="${safeCallerId}" timeout="20" action="${actionUrl}" method="POST"${statusCallbackUrl ? ' statusCallback="' + statusCallbackUrl + '" statusCallbackEvent="answered"' : ''}><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Przepraszamy, nikt nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}

export function humanHandoffNextTwiML(targetNumber: string, callerId: string, businessId: string, idx: number, baseUrlOverride?: string): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const baseUrl = (baseUrlOverride || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || "http://localhost:3000").replace(/\/+$/, "");
  const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${businessId}&idx=${idx}`;
  return `<Dial callerId="${safeCallerId}" timeout="20" action="${actionUrl}" method="POST"><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Przepraszamy, nikt nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}