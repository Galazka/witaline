import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { USD_TO_PLN, ELEVENLABS_COST_PER_MIN_PLN, TWILIO_AVG_COST_PER_MIN_PLN, OPENROUTER_COST_PER_MIN_PLN, TWILIO_SMS_COST_PER_SEGMENT_PNL } from "@/lib/cost-rates";

export const dynamic = "force-dynamic";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const businessId = searchParams.get("businessId");

  const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const toDate = to || new Date().toISOString().slice(0, 10);

  const headers = [
    "Data", "Call SID", "Business ID", "Firma", "Numer wejsciowy", "Klient",
    "Czas [s]", "Czas [min]",
    "Koszt ElevenLabs [PLN]", "Koszt Twilio [PLN]", "Koszt OpenRouter [PLN]", "Koszt transferu [PLN]",
    "Koszt wiadomosci SMS [PLN]", "KOSZT CAŁKOWITY [PLN]",
    "Przychod [PLN]", "Marża [PLN]",
    "Status", "Typ", "Conversation ID"
  ];

  const rows: string[][] = [headers];

  let query = supabaseAdmin
    .from("call_logs")
    .select("*")
    .is("deleted_at", null)
    .gte("created_at", fromDate)
    .lte("created_at", toDate + "T23:59:59")
    .order("created_at", { ascending: true });

  if (businessId) query = query.eq("business_id", businessId);

  const { data: callLogs } = await query;

  const bizIds = new Set<string>();
  for (const l of callLogs || []) {
    if (l.business_id) bizIds.add(l.business_id);
  }

  const bizMap = new Map<string, string>();
  if (bizIds.size > 0) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("id, name")
      .in("id", [...bizIds]);
    for (const b of biz || []) bizMap.set(b.id, b.name);
  }

  for (const log of callLogs || []) {
    const minutes = (log.duration_seconds || 0) / 60;
    const costEL = Number(log.cost_elevenlabs) || 0;
    const costTW = Math.abs(Number(log.cost_twilio)) || 0;
    const costOR = Number(log.cost_openrouter) || 0;
    const consultantCost = log.routed_to_extension
      ? Math.round(minutes * TWILIO_AVG_COST_PER_MIN_PLN * 100) / 100
      : 0;
    const smsCost = 0;
    const totalCost = Math.round((costEL + costTW + costOR + consultantCost + smsCost) * 100) / 100;
    const revenue = Number(log.revenue_pln) || 0;
    const margin = Math.round((revenue - totalCost) * 100) / 100;

    rows.push([
      escapeCSV((log.created_at || "").slice(0, 10)),
      escapeCSV(log.twilio_call_sid),
      escapeCSV(log.business_id),
      escapeCSV(bizMap.get(log.business_id) || ""),
      escapeCSV(log.from_number || log.caller_id || ""),
      escapeCSV(log.caller_id || ""),
      escapeCSV(log.duration_seconds),
      escapeCSV(minutes.toFixed(2)),
      escapeCSV(costEL.toFixed(4)),
      escapeCSV(costTW.toFixed(4)),
      escapeCSV(costOR.toFixed(4)),
      escapeCSV(consultantCost.toFixed(4)),
      escapeCSV(smsCost.toFixed(4)),
      escapeCSV(totalCost.toFixed(4)),
      escapeCSV(revenue.toFixed(4)),
      escapeCSV(margin.toFixed(4)),
      escapeCSV(log.classification || ""),
      escapeCSV(log.routed_to_extension ? "transfer" : "ai"),
      escapeCSV(log.elevenlabs_conversation_id || ""),
    ]);
  }

  const csv = rows.map(r => r.join(",")).join("\n");
  const filename = `witaline-rozliczenia-${fromDate}-${toDate}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
