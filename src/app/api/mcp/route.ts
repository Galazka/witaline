import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsApp } from "@/lib/twilio-whatsapp";
import { redirectCallWithTransferTwiML } from "@/lib/twilio-utils";
import { setPendingTransfer } from "@/lib/transfer-store";
import { getActiveCallSids } from "@/lib/active-call-store";
import { withCache } from "@/lib/cache";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WITALINE_MAIN_BUSINESS = "00000000-0000-0000-0000-000000000001";

async function checkTrial(businessId: string): Promise<boolean> {
  if (businessId === WITALINE_MAIN_BUSINESS) return true;
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("subscription_status, trial_ends_at")
    .eq("id", businessId)
    .maybeSingle();
  if (!data) return false;
  if (data.subscription_status === "trialing" && data.trial_ends_at && new Date(data.trial_ends_at) < new Date()) return false;
  return true;
}

const TOOLS = [
  { name: "business_lookup", description: "Wyszukaj firme po nazwie lub numerze wewnetrznym", inputSchema: { type: "object", properties: { query: { type: "string", description: "Nazwa firmy lub numer wewnetrzny (DTMF)" } }, required: ["query"] } },
  { name: "save_lead", description: "Zapisz lead/wiadomosc od klienta", inputSchema: { type: "object", properties: { name: { type: "string", description: "Imie i nazwisko klienta" }, phone: { type: "string", description: "Numer telefonu klienta" }, message: { type: "string", description: "Tresc wiadomosci" }, business_id: { type: "string", description: "ID firmy (z dynamic_variables)" } }, required: ["name", "phone"] } },
  { name: "send_whatsapp", description: "Wyslij wiadomosc WhatsApp", inputSchema: { type: "object", properties: { phone: { type: "string", description: "Numer telefonu" }, message: { type: "string", description: "Tresc wiadomosci" } }, required: ["phone"] } },
  { name: "check_availability", description: "Sprawdz dostepnosc terminow", inputSchema: { type: "object", properties: { business_id: { type: "string", description: "ID firmy" }, date: { type: "string", description: "Data w formacie YYYY-MM-DD" } }, required: ["business_id", "date"] } },
  { name: "create_reservation", description: "Utworz rezerwacje/spotkanie", inputSchema: { type: "object", properties: { business_id: { type: "string" }, reserved_at: { type: "string", description: "Data i czas w formacie ISO" }, service_type: { type: "string", description: "Rodzaj uslugi" }, caller_name: { type: "string", description: "Imie klienta" }, caller_phone: { type: "string", description: "Telefon klienta" } }, required: ["business_id", "reserved_at", "service_type", "caller_name"] } },
  { name: "get_services", description: "Pobierz liste uslug firmy", inputSchema: { type: "object", properties: { business_id: { type: "string" } }, required: ["business_id"] } },
  { name: "get_business_hours", description: "Pobierz godziny otwarcia firmy", inputSchema: { type: "object", properties: { business_id: { type: "string" } }, required: ["business_id"] } },
  { name: "transfer_to_human", description: "Przekaz rozmowe do konsultanta", inputSchema: { type: "object", properties: { business_id: { type: "string" }, caller_phone: { type: "string", description: "Telefon klienta (opcjonalny)" }, to_number: { type: "string", description: "Numer konsultanta (opcjonalny)" }, call_sid: { type: "string", description: "Twilio Call SID (z kontekstu dynamic_variables.call_sid)" } }, required: ["business_id"] } },
  { name: "create_checkout", description: "Utworz sesje platnosci Stripe", inputSchema: { type: "object", properties: { plan: { type: "string", description: "Nazwa planu: start/growth/enterprise" }, business_id: { type: "string" } }, required: ["plan", "business_id"] } }
];

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(request: NextRequest) {
  // Rate limit: 120 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "mcp-unknown";
  const rl = rateLimitMiddleware(`mcp:${ip}`, 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limited" } },
      { status: 429, headers: rl.headers }
    );
  }

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

      let bizId = args.business_id || WITALINE_MAIN_BUSINESS;
      if (toolName !== "business_lookup" && toolName !== "send_whatsapp") {
        if (!(await checkTrial(bizId))) {
          result = JSON.stringify({ ok: false, error: "Trial expired" });
          return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result }] } });
        }
      }

      if (toolName === "business_lookup") {
        const trimmed = args.query?.trim() || "";
        const isDtmf = /^\d{1,6}$/.test(trimmed);
        const cacheKey = `business_lookup:${isDtmf ? "ext" : "name"}:${trimmed}`;
        const data = await withCache(cacheKey, async () => {
          const { data } = await supabaseAdmin.from("businesses").select("id, name, phone, extension, current_plan, industry").or(isDtmf ? `extension.eq.${trimmed}` : `name.ilike.%${trimmed}%`).limit(1).maybeSingle();
          return data;
        }, 30_000);
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
        const cacheKey = `services:${bizId}`;
        const svc = await withCache(cacheKey, async () => {
          const { data } = await supabaseAdmin.from("businesses").select("services").eq("id", bizId).maybeSingle();
          if (data?.services) {
            try { return typeof data.services === "string" ? JSON.parse(data.services) : data.services; } catch {}
          }
          return [];
        }, 30_000);
        result = JSON.stringify({ ok: true, services: svc });
      }
      else if (toolName === "get_business_hours") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const cacheKey = `hours:${bizId}`;
        const hours = await withCache(cacheKey, async () => {
          const { data } = await supabaseAdmin.from("businesses").select("calendar_settings").eq("id", bizId).maybeSingle();
          if (data?.calendar_settings) {
            try { return typeof data.calendar_settings === "string" ? JSON.parse(data.calendar_settings) : data.calendar_settings; } catch {}
          }
          return {};
        }, 30_000);
        result = JSON.stringify({ ok: true, hours });
      }
      else if (toolName === "check_availability") {
        const bizId = args.business_id || WITALINE_MAIN_BUSINESS;
        const date = args.date || "";
        const cacheKey = `hours:${bizId}`;
        const hours = await withCache(cacheKey, async () => {
          const { data } = await supabaseAdmin.from("businesses").select("calendar_settings").eq("id", bizId).maybeSingle();
          if (data?.calendar_settings) {
            try { return typeof data.calendar_settings === "string" ? JSON.parse(data.calendar_settings) : data.calendar_settings; } catch {}
          }
          return {};
        }, 30_000) as Record<string, unknown>;
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
        const callerPhone = args.caller_phone || "";
        const toNumber = args.to_number || "";
        let callSid = args.call_sid || "";

        // If agent didn't pass a valid callSid, try all stored call SIDs for this business
        if (!callSid || callSid === "unknown" || !callSid.startsWith("CA")) {
          const allSids = await getActiveCallSids(bizId);
          callSid = allSids.length > 0 ? allSids[allSids.length - 1] : "";
        }

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
            .select("phone, name, twilio_number")
            .eq("id", bizId)
            .maybeSingle();
          targetNumber = biz?.phone || process.env.WITALINE_CONSULTANT_NUMBER || "";
        }

        if (!targetNumber) {
          result = JSON.stringify({ ok: false, error: "Brak skonfigurowanego numeru konsultanta" });
        } else {
          const { data: biz } = await supabaseAdmin
            .from("businesses")
            .select("name, twilio_number")
            .eq("id", bizId)
            .maybeSingle();
          const callerId = biz?.twilio_number || process.env.TWILIO_PHONE_NUMBER || "";

          // Always store as fallback (in case REST API fails)
          await setPendingTransfer(bizId, {
            businessId: bizId,
            targetNumber,
            callerId,
            businessName: biz?.name || "WitaLine",
            fromNumber: callerPhone,
            toNumber,
            createdAt: Date.now(),
          });

          // Try immediate REST API redirect using callSid (most reliable)
          let restApiOk = false;
          const allSids = callSid ? [callSid] : await getActiveCallSids(bizId);
          if (allSids.length > 0) {
            const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            for (const sid of allSids) {
              const redirectResult = await redirectCallWithTransferTwiML(sid, targetNumber, callerId, baseUrl, bizId, consultants?.length ? 1 : 0);
              if (redirectResult.ok) {
                restApiOk = true;
                console.log("[MCP transfer_to_human] REST API redirect ok for", sid);
                break;
              }
              console.warn("[MCP transfer_to_human] REST API redirect failed for", sid, ":", redirectResult.message);
            }
          }

          console.log("[MCP transfer_to_human] stored for", bizId, "→", targetNumber, "restApi:", restApiOk);
          result = JSON.stringify({
            ok: true,
            target: targetNumber,
            business: biz?.name || "WitaLine",
            rest_api_redirect: restApiOk,
            message: restApiOk
              ? "Transfer initiated. Call redirected to consultant."
              : "Transfer initiated. Caller will be connected when the conversation ends.",
          });
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