import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsApp, WHATSAPP_CONTINUITY_TEMPLATES } from "@/lib/twilio-whatsapp";
import { escapeXml, twimlDocument } from "@/lib/twilio-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WITALINE_MAIN_BUSINESS = "00000000-0000-0000-0000-000000000001";

const TOOLS = [
  { name: "business_lookup", description: "Wyszukaj firme po nazwie lub numerze wewnetrznym", inputSchema: { type: "object", properties: { query: { type: "string", description: "Nazwa firmy lub numer wewnetrzny (DTMF)" } }, required: ["query"] } },
  { name: "save_lead", description: "Zapisz lead/wiadomosc od klienta", inputSchema: { type: "object", properties: { name: { type: "string", description: "Imie i nazwisko klienta" }, phone: { type: "string", description: "Numer telefonu klienta" }, message: { type: "string", description: "Tresc wiadomosci" }, business_id: { type: "string", description: "ID firmy (z dynamic_variables)" } }, required: ["name", "phone"] } },
  { name: "send_whatsapp", description: "Wyslij wiadomosc WhatsApp", inputSchema: { type: "object", properties: { phone: { type: "string", description: "Numer telefonu" }, message: { type: "string", description: "Tresc wiadomosci" } }, required: ["phone"] } },
  { name: "check_availability", description: "Sprawdz dostepnosc terminow", inputSchema: { type: "object", properties: { business_id: { type: "string", description: "ID firmy" }, date: { type: "string", description: "Data w formacie YYYY-MM-DD" } }, required: ["business_id", "date"] } },
  { name: "create_reservation", description: "Utworz rezerwacje/spotkanie", inputSchema: { type: "object", properties: { business_id: { type: "string" }, reserved_at: { type: "string", description: "Data i czas w formacie ISO" }, service_type: { type: "string", description: "Rodzaj uslugi" }, caller_name: { type: "string", description: "Imie klienta" }, caller_phone: { type: "string", description: "Telefon klienta" } }, required: ["business_id", "reserved_at", "service_type", "caller_name"] } },
  { name: "get_services", description: "Pobierz liste uslug firmy", inputSchema: { type: "object", properties: { business_id: { type: "string" } }, required: ["business_id"] } },
  { name: "get_business_hours", description: "Pobierz godziny otwarcia firmy", inputSchema: { type: "object", properties: { business_id: { type: "string" } }, required: ["business_id"] } },
  { name: "transfer_to_human", description: "Przekaz rozmowe do konsultanta", inputSchema: { type: "object", properties: { business_id: { type: "string" }, caller_phone: { type: "string", description: "Telefon klienta" }, to_number: { type: "string", description: "Numer konsultanta" } }, required: ["business_id", "caller_phone", "to_number"] } },
  { name: "create_checkout", description: "Utworz sesje platnosci Stripe", inputSchema: { type: "object", properties: { plan: { type: "string", description: "Nazwa planu: start/growth/enterprise" }, business_id: { type: "string" } }, required: ["plan", "business_id"] } }
];

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, method, params } = body;

      if (method === "initialize") {
        return NextResponse.json({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "witaline-mcp", version: "1.0.0" } } });
      }

    if (method === "tools/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    }

    if (method === "tools/call") {
      const rawName = params?.name || "";
      const toolName = rawName.startsWith("witaline-tools_") ? rawName.slice("witaline-tools_".length) : rawName;
      const args = params?.arguments || {};

      console.log("[MCP tools/call] raw:", rawName, "stripped:", toolName, "args:", JSON.stringify(args));

      let result = "";

      if (toolName === "business_lookup") {
        const trimmed = args.query?.trim() || "";
        const isDtmf = /^\d{1,6}$/.test(trimmed);
        let { data } = await supabaseAdmin.from("businesses").select("id, name, phone, extension, current_plan, industry").or(isDtmf ? `extension.eq.${trimmed}` : `name.ilike.%${trimmed}%`).limit(1).maybeSingle();
        result = JSON.stringify({ ok: !!data, business: data || null });
      }
      else if (toolName === "save_lead") {
        const phone = args.phone || "";
        const cleanPhone = phone.replace(/\D/g, "");
        const { data, error } = await supabaseAdmin.from("leads").insert({
          company_name: args.name || "Nieznany",
          nip: args.nip || "",
          contact_email: args.email || args.contact_email || "",
          phone: cleanPhone || "000000000",
          message: args.message || "",
          status: "new",
          type: "kontakt",
          knowledge_base_raw: args.notes || "",
          business_id: args.business_id || WITALINE_MAIN_BUSINESS,
          created_at: new Date().toISOString()
        }).select().single();
        console.log("[MCP save_lead] result:", error ? error.message : "ok id=" + data?.id);
        result = JSON.stringify({ ok: !error, lead: error ? null : data, error: error?.message });
      }
      else if (toolName === "send_whatsapp") {
        const phone = args.phone || "";
        const message = args.message || "Wiadomosc z WitaLine";
        try {
          const waResult = await sendWhatsApp(phone, message, undefined, undefined, undefined);
          result = JSON.stringify({ ok: waResult.success, sid: waResult.twilioSid || null, error: waResult.error || null });
        } catch (e) {
          result = JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      }
      else if (toolName === "get_services") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const { data } = await supabaseAdmin.from("businesses").select("services").eq("id", bizId).maybeSingle();
        let svc = [];
        if (data?.services) {
          try { svc = typeof data.services === "string" ? JSON.parse(data.services) : data.services; } catch {}
        }
        result = JSON.stringify({ ok: true, services: svc });
      }
      else if (toolName === "get_business_hours") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const { data } = await supabaseAdmin.from("businesses").select("calendar_settings").eq("id", bizId).maybeSingle();
        let hours = {};
        if (data?.calendar_settings) {
          try { hours = typeof data.calendar_settings === "string" ? JSON.parse(data.calendar_settings) : data.calendar_settings; } catch {}
        }
        result = JSON.stringify({ ok: true, hours });
      }
      else if (toolName === "check_availability") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const date = args.date || "";
        const { data } = await supabaseAdmin.from("businesses").select("calendar_settings").eq("id", bizId).maybeSingle();
        let hours: Record<string, unknown> = {};
        if (data?.calendar_settings) {
          try { hours = typeof data.calendar_settings === "string" ? JSON.parse(data.calendar_settings) : data.calendar_settings; } catch {}
        }
        const dayName = ["niedziela","poniedzialek","wtorek","sroda","czwartek","piatek","sobota"][new Date(date).getDay()];
        const daySlots = dayName ? (hours[dayName] as unknown[]) || [] : [];
        result = JSON.stringify({ ok: true, date, day: dayName, slots: daySlots, calendar_settings: hours });
      }
      else if (toolName === "create_reservation") {
        const { data, error } = await supabaseAdmin.from("reservations").insert({
          business_id: args.business_id || WITALINE_MAIN_BUSINESS,
          reserved_at: args.reserved_at,
          service_type: args.service_type,
          caller_name: args.caller_name,
          caller_phone: args.caller_phone || "",
          status: "confirmed",
          created_at: new Date().toISOString()
        }).select().single();
        result = JSON.stringify({ ok: !error, reservation: error ? null : data, error: error?.message });
      }
      else if (toolName === "transfer_to_human") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;

        let targetNumber = "";
        const { data: consultants } = await supabaseAdmin
          .from("business_consultants")
          .select("phone")
          .eq("business_id", bizId)
          .order("sort_order", { ascending: true });
        if (consultants && consultants.length > 0) {
          targetNumber = consultants[0].phone;
        } else {
          const { data: biz } = await supabaseAdmin
            .from("businesses")
            .select("phone")
            .eq("id", bizId)
            .maybeSingle();
          targetNumber = biz?.phone || process.env.WITALINE_CONSULTANT_NUMBER || "";
        }

        if (!targetNumber) {
          result = JSON.stringify({ ok: false, error: "Brak skonfigurowanego numeru konsultanta" });
        } else {
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;
          const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "";
          const apiKey = process.env.ELEVENLABS_API_KEY || "";
          const agentId = process.env.ELEVENLABS_AGENT_ID || "";
          let callSid = "";
          let callerNumber = "";
          let conversationId = "";

          // 1. Find the active Twilio call and get the caller's real number
          if (sid && token && twilioNumber) {
            const auth = Buffer.from(`${sid}:${token}`).toString("base64");
            try {
              const sp = new URLSearchParams({ To: twilioNumber, Status: "in-progress", PageSize: "1" });
              const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json?${sp}`, {
                headers: { Authorization: `Basic ${auth}` },
              });
              if (res.ok) {
                const data = await res.json();
                const call = data?.calls?.[0];
                callSid = call?.sid || "";
                callerNumber = call?.from || "";
              }
            } catch (e) {
              console.error("[MCP transfer_to_human] fetch error:", e);
            }
          }

          if (!callSid || !callerNumber) {
            result = JSON.stringify({ ok: false, error: "Nie znaleziono aktywnego polaczenia lub numeru dzwoniacego", target: targetNumber, call_sid: callSid, caller: callerNumber });
          } else {
            // WARM TRANSFER: stay on the line + queue with retries
            // 1. Create queue entry
            // 2. Call consultant with StatusCallback (retry on busy)
            // 3. Check status after 2s
            // 4. Always redirect user to conference (they wait with music)
            // 5. /api/twilio/transfer-status handles retries via Twilio callback

            const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
            const roomName = `handoff_${callSid}`;
            const roomNameSafe = escapeXml(roomName);
            const waitUrl = escapeXml(`${baseUrl}/api/twilio/transfer-wait`);
            const statusCallbackUrl = escapeXml(`${baseUrl}/api/twilio/transfer-status?room=${roomName}`);
            const maxAttempts = 5;

            let consultantCallSid = "";
            let queueId = "";

            // 0. Create queue entry
            try {
              const { data: queue } = await supabaseAdmin
                .from("transfer_queue")
                .insert({
                  business_id: bizId,
                  caller_phone: callerNumber,
                  call_sid: callSid,
                  conference_room: roomName,
                  consultant_phone: targetNumber,
                  status: "waiting",
                  attempts: 0,
                  max_attempts: maxAttempts,
                })
                .select("id")
                .single();
              if (queue) queueId = queue.id;
            } catch (e) {
              console.error("[MCP transfer_to_human] queue create error:", e);
            }

            // 1. Call consultant with conference TwiML + StatusCallback
            try {
              const auth = Buffer.from(`${sid!}:${token!}`).toString("base64");
              const consulTwiml = `
                <Dial>
                  <Conference endConferenceOnExit="false">${roomNameSafe}</Conference>
                </Dial>
              `.trim();
              const consulBody = new URLSearchParams({
                To: targetNumber,
                From: twilioNumber,
                Twiml: twimlDocument(consulTwiml),
                Timeout: "30",
                StatusCallback: statusCallbackUrl,
                StatusCallbackEvent: "initiated+ringing+answered+completed",
              });
              const resConsul = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
                method: "POST",
                headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
                body: consulBody.toString(),
              });
              if (resConsul.ok) {
                const d = await resConsul.json();
                consultantCallSid = d?.sid || "";
                console.log("[MCP transfer_to_human] consultant call initiated:", consultantCallSid);
              } else {
                const errText = await resConsul.text();
                console.error("[MCP transfer_to_human] consultant call failed:", resConsul.status, errText.slice(0, 300));
              }
            } catch (e) {
              console.error("[MCP transfer_to_human] consultant call error:", e);
            }

            // 2. Wait 2s then check consultant call status
            await new Promise(r => setTimeout(r, 2000));

            let consultantStatus = "";
            if (consultantCallSid) {
              try {
                const auth = Buffer.from(`${sid!}:${token!}`).toString("base64");
                const statusRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${consultantCallSid}.json`, {
                  headers: { Authorization: `Basic ${auth}` },
                });
                if (statusRes.ok) {
                  const statusData = await statusRes.json();
                  consultantStatus = statusData.status || "";
                  console.log("[MCP transfer_to_human] consultant call status:", consultantStatus);
                }
              } catch (e) {
                console.error("[MCP transfer_to_human] status check error:", e);
              }
            }

            if (consultantStatus === "busy" || consultantStatus === "failed") {
              console.log("[MCP transfer_to_human] consultant busy — queued, user waits in conference");
            }

            // 3. ALWAYS redirect user to conference (waits with music + retries)
            let redirectSuccess = false;
            try {
              const auth = Buffer.from(`${sid!}:${token!}`).toString("base64");
              const userTwiml = `
                <Dial>
                  <Conference endConferenceOnExit="true" waitUrl="${waitUrl}">${roomNameSafe}</Conference>
                </Dial>
              `.trim();
              const redirectBody = new URLSearchParams({ Twiml: twimlDocument(userTwiml) });
              const resRedirect = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callSid}.json`, {
                method: "POST",
                headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
                body: redirectBody.toString(),
              });
              if (resRedirect.ok) {
                redirectSuccess = true;
                console.log("[MCP transfer_to_human] user redirected to conference:", callSid);
              } else {
                const errText = await resRedirect.text();
                console.error("[MCP transfer_to_human] redirect failed:", resRedirect.status, errText.slice(0, 300));
              }
            } catch (e) {
              console.error("[MCP transfer_to_human] redirect error:", e);
            }

            if (redirectSuccess) {
              const wasBusy = consultantStatus === "busy" || consultantStatus === "failed";
              result = JSON.stringify({
                ok: true,
                target: targetNumber,
                caller: callerNumber,
                conference: roomName,
                call_sid: callSid,
                consultant_call_sid: consultantCallSid || null,
                queue_id: queueId || null,
                busy: wasBusy,
                message: wasBusy
                  ? "Konsultant zajęty — klient czeka w kolejce, system sam spróbuje ponownie."
                  : "Przekierowano do konsultanta (warm transfer).",
              });
            } else {
              result = JSON.stringify({
                ok: false,
                error: "Nie udalo sie przekierowac do konsultanta",
                target: targetNumber,
                caller: callerNumber,
              });
            }
          }
        }
      }
      else if (toolName === "create_checkout") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const plan = args.plan || "growth";
        const fromUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
        result = JSON.stringify({
          ok: true,
          checkout_url: fromUrl ? `${fromUrl}/checkout?plan=${plan}&business_id=${bizId}` : "no_app_url",
          plan,
          business_id: bizId
        });
      }
      else {
        result = JSON.stringify({ ok: false, error: "Unknown tool: " + toolName });
      }

      return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result }] } });
    }

    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  } catch (e) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
}

export async function DELETE() {
  return new Response(null, { status: 200 });
}