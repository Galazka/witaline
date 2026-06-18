import { NextResponse } from "next/server";
import * as https from "https";

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

function twilioBasicAuth(): string | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return Buffer.from(`${sid}:${token}`).toString("base64");
}

function twilioApiRequest(method: "GET" | "POST", path: string, body?: URLSearchParams): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const auth = twilioBasicAuth();
    if (!auth) { resolve({ status: 500, data: { message: "Twilio credentials not configured" } }); return; }
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

function registerCall(fromNumber: string, toNumber: string, businessId?: string, callSid?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      from_number: fromNumber, to_number: toNumber, direction: "inbound",
      dynamic_vars: businessId ? { business_id: businessId, call_sid: callSid || undefined, caller_phone: fromNumber || undefined, to_number: toNumber || undefined } : undefined,
      conversation_initiation_client_data: { dynamic_variables: { business_id: businessId || "00000000-0000-0000-0000-000000000001", caller_number: fromNumber, call_sid: callSid || "" } }
    });
    const req = https.request({ method: "POST", hostname: "api.elevenlabs.io", path: "/v1/convai/twilio/register-call", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "xi-api-key": process.env.ELEVENLABS_API_KEY! } }, (res) => {
      let d = "";
      res.on("data", (chunk) => (d += chunk));
      res.on("end", () => { if (res.statusCode !== 200) reject(new Error(`${res.statusCode}: ${d}`)); else resolve(d); });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

export async function connectToAgent(systemPrompt: string | null, name: string, businessId: string, callSid: string, fromNumber: string, toNumber: string, voiceId?: string, voiceName?: string): Promise<Response> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) return twiml(`<Say language="pl-PL">Asystent AI jest w trakcie konfiguracji. Prosimy spróbować później.</Say><Hangup/>`);
  try {
    const xml = await registerCall(fromNumber, toNumber, businessId, callSid);
    const match = xml.match(/name="conversation_id"\s+value="([^"]+)"/);
    if (match) return new NextResponse(xml, { status: 200, headers: { "Content-Type": "application/xml" } });
  } catch (err) { console.error("[connectToAgent] register-call failed:", err instanceof Error ? err.message : String(err)); }
  return twiml(`<Say language="pl-PL">Przepraszamy, wystąpił problem z połączeniem. Proszę spróbować później.</Say><Hangup/>`);
}

export async function redirectActiveCallToHumanHandoff(callSid: string, twimlBody: string): Promise<{ ok: boolean; status?: number; message: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  if (!sid) return { ok: false, message: "Twilio account SID is not configured" };
  const body = new URLSearchParams({ Twiml: twimlDocument(twimlBody) });
  const res = await twilioApiRequest("POST", `/2010-04-01/Accounts/${sid}/Calls/${callSid}.json`, body);
  if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, message: "Call redirected to human handoff" };
  return { ok: false, status: res.status, message: typeof res.data === "string" ? res.data : res.data?.message || "Twilio redirect failed" };
}

export function humanHandoffTwiML(targetNumber: string, callerId: string, businessName: string, reason = "human"): Response {
  return twiml(humanHandoffTwiMLString(targetNumber, callerId, businessName, reason));
}

export function humanHandoffTwiMLString(targetNumber: string, callerId: string, businessName: string, reason = "human"): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const safeBusiness = escapeXml(businessName);
  const reasonText = reason === "dtmf" ? "Naciśnięto 0." : "Klient poprosił o konsultanta.";
  return `<Say language="pl-PL">Przekazuję połączenie do konsultanta firmy ${safeBusiness}. ${reasonText} Proszę czekać.</Say><Say language="pl-PL">Rozmowa z konsultantem może być nagrywana i analizowana w celu poprawy jakości obsługi.</Say><Dial callerId="${safeCallerId}" timeout="25" record="record-from-answer"><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Konsultant obecnie nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}

export function humanHandoffHuntTwiML(targetNumber: string, callerId: string, businessName: string, businessId: string, idx: number, total: number): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const safeBusiness = escapeXml(businessName);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${businessId}&idx=${idx}`;
  const reasonText = idx === 0 ? "Klient poprosił o konsultanta." : "";
  return `<Say language="pl-PL">${reasonText ? reasonText + " " : ""}Proszę czekać.</Say><Dial callerId="${safeCallerId}" timeout="20" action="${actionUrl}" method="POST"><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Przepraszamy, nikt nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}

export function humanHandoffNextTwiML(targetNumber: string, callerId: string, businessId: string, idx: number): string {
  const safeTarget = escapeXml(targetNumber);
  const safeCallerId = escapeXml(callerId);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const actionUrl = `${baseUrl}/api/twilio/human-handoff/next?businessId=${businessId}&idx=${idx}`;
  return `<Dial callerId="${safeCallerId}" timeout="20" action="${actionUrl}" method="POST"><Number>${safeTarget}</Number></Dial><Say language="pl-PL">Przepraszamy, nikt nie odbiera. Oddzwonimy z podsumowaniem rozmowy.</Say><Hangup/>`;
}