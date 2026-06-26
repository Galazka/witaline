import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, channels, status, flagged, dateFrom, dateTo, tag } = body;

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_uid", session.user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null);

  if (channels?.length) query = query.in("channel", channels);
  if (status) query = query.eq("status", status);
  if (flagged === true) query = query.eq("flagged", true);
  if (flagged === false) query = query.or("flagged.is.null,flagged.eq.false");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (tag) query = query.contains("tags", [tag]);

  query = query.order("created_at", { ascending: false }).limit(5000);

  const { data: conversations, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (conversations || []).map((c: any) => ({
    Data: new Date(c.created_at).toLocaleString("pl-PL"),
    Status: c.status,
    Kanał: c.channel,
    Klient: c.caller_name || c.caller_id || "",
    Podsumowanie: (c.summary || "").replace(/"/g, '""'),
    Tagi: (c.tags || []).join(", "),
    Sentyment: c.sentiment || "",
    Czas_trwania_sek: c.duration_seconds || 0,
    Oflagowana: c.flagged ? "Tak" : "Nie",
  }));

  const header = Object.keys(rows[0] || {}).join(";");
  const csv = [header, ...rows.map((r: any) => Object.values(r).map(v => `"${v}"`).join(";"))].join("\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rozmowy-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
