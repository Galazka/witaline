import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, dateFrom, dateTo, classification, minDuration, maxDuration, flagged } = body;

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_uid", session.user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = supabaseAdmin
    .from("call_logs")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null);

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (classification) query = query.eq("classification", classification);
  if (minDuration !== undefined) query = query.gte("duration_seconds", minDuration);
  if (maxDuration !== undefined) query = query.lte("duration_seconds", maxDuration);
  if (flagged === true) query = query.eq("flagged", true);
  if (flagged === false) query = query.or("flagged.is.null,flagged.eq.false");

  query = query.order("created_at", { ascending: false }).limit(5000);

  const { data: logs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (logs || []).map((l: any) => ({
    Data: new Date(l.created_at).toLocaleString("pl-PL"),
    Klient: l.caller_id || "",
    Czas_sek: l.duration_seconds || 0,
    Koszt_PLN: (l.cost_pln || 0).toFixed(2),
    Klasyfikacja: l.classification || "",
    Podsumowanie: (l.ai_summary || "").replace(/"/g, '""'),
    Jakość: l.quality_score ?? "",
    Oflagowana: l.flagged ? "Tak" : "Nie",
  }));

  const header = Object.keys(rows[0] || {}).join(";");
  const csv = [header, ...rows.map((r: any) => Object.values(r).map(v => `"${v}"`).join(";"))].join("\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="polaczenia-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
