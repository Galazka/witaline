"use client";

import { useEffect, useState, useCallback } from "react";

/* ── Types ── */
interface BizBrief {
  id: string; name: string;
}
interface HourlyData { hour: string; count: number }
interface DailyData { date: string; calls: number; convos: number }
interface BizBreakdownRow { id: string; name: string; calls: number; conversations: number; minutes: number; cost: string; orders: number }
interface SourceBreakdown { web: number; voice: number; widget: number; sms: number; phone: number }
interface CallLogRow {
  id: string; business_id: string; business_name: string; date: string;
  from_number: string; duration_seconds: number; cost_pln: number;
  classification: string; summary: string;
}

interface StatsData {
  totalCalls: number; totalConversations: number; todayCalls: number;
  orders: number; inquiries: number; spam: number; bookings: number;
  avgDuration: number; totalMinutes: number; totalCost: string;
  hours24: HourlyData[]; dailyData: DailyData[]; topCallers: [string, number][];
  sourceBreakdown: SourceBreakdown; bizBreakdown: BizBreakdownRow[];
  callLogs: CallLogRow[]; businesses: BizBrief[];
  range: string;
}

type Range = "7" | "30" | "90" | "all" | "custom";

/* ── Helpers ── */
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function fmtDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminGlobalStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>("7");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [businessId, setBusinessId] = useState("all");

  // Table filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"date" | "duration" | "cost">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const fetchStats = useCallback(async (r: Range, biz: string, from?: string, to?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("businessId", biz);
    if (r === "custom" && from && to) {
      params.set("from", from); params.set("to", to);
    } else {
      params.set("range", r);
    }
    try {
      const res = await fetch(`/api/admin/stats?${params}`);
      if (res.ok) { setStats(await res.json()); setPage(0); }
    } catch { /* ignore */ }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => {
    if (range === "custom" && fromDate && toDate) fetchStats("custom", businessId, fromDate, toDate);
    else if (range !== "custom") fetchStats(range, businessId);
  }, [range, businessId, fetchStats]);

  function handleRefresh() {
    setRefreshing(true);
    if (range === "custom" && fromDate && toDate) fetchStats("custom", businessId, fromDate, toDate);
    else fetchStats(range, businessId);
  }

  function handleRangeChange(newRange: Range) {
    setRange(newRange); setPage(0);
    if (newRange !== "custom") { setFromDate(""); setToDate(""); }
  }

  // Sort & filter callLogs
  const filtered = (stats?.callLogs || [])
    .filter(r => classFilter === "all" || r.classification === classFilter)
    .filter(r => !search.trim() || r.business_name.toLowerCase().includes(search.toLowerCase()) || r.from_number.includes(search))
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === "duration") return (a.duration_seconds - b.duration_seconds) * mul;
      if (sortKey === "cost") return (a.cost_pln - b.cost_pln) * mul;
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * mul;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const isLoading = loading || refreshing;
  if (isLoading && !stats) return <p className="text-center text-zinc-400 py-8">Ładowanie statystyk...</p>;

  const maxHourly = stats ? Math.max(...stats.hours24.map(h => h.count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* ── Controls ── */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
        {/* Business selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-zinc-500">Firma:</label>
          <select value={businessId} onChange={e => { setBusinessId(e.target.value); setPage(0); }}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white">
            <option value="all">🏢 Wszystkie firmy</option>
            {(stats?.businesses || []).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <span className="text-zinc-200 mx-1">|</span>

          {/* Range buttons */}
          {([["7", "7 dni"], ["30", "30 dni"], ["90", "90 dni"], ["all", "Wszystko"]] as [Range, string][]).map(([key, label]) => (
            <button key={key} onClick={() => handleRangeChange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${range === key ? "bg-brand-400 text-white" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"}`}>
              {label}
            </button>
          ))}

          {/* Custom date */}
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs" />
            <span className="text-xs text-zinc-400">—</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs" />
            <button onClick={() => { if (fromDate && toDate) { setRange("custom"); fetchStats("custom", businessId, fromDate, toDate); } }}
              disabled={!fromDate || !toDate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-400 text-white hover:bg-brand-500 disabled:opacity-50">
              Filtruj
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={handleRefresh} disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-zinc-600 hover:bg-brand-100 disabled:opacity-50">
              {refreshing ? "..." : "🔄 Odśwież"}
            </button>
          </div>
        </div>
      </div>

      {!stats ? (
        <p className="text-center text-red-500 py-8">Błąd ładowania statystyk.</p>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {[
              ["📞", "Rozmowy", stats.totalCalls, "text-zinc-900"],
              ["💬", "Czaty", stats.totalConversations, "text-zinc-900"],
              ["📞", "Dziś", stats.todayCalls, "text-brand-500"],
              ["⏱️", "Śr. czas", fmtTime(stats.avgDuration), "text-zinc-900"],
              ["💰", "Koszt", `${stats.totalCost} PLN`, "text-amber-600"],
              ["🛒", "Zamówienia", stats.orders, "text-green-600"],
              ["📊", "Minuty", stats.totalMinutes, "text-zinc-900"],
            ].map(([icon, label, value, color]) => (
              <div key={label} className="bg-white rounded-xl border border-zinc-200 p-3">
                <p className="text-[10px] text-zinc-400">{icon} {label}</p>
                <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Source breakdown + Classification ── */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Source */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Źródła</h3>
              <div className="space-y-2">
                {[
                  ["Telefon (Twilio)", stats.sourceBreakdown.phone, "bg-brand-500"],
                  ["Voice chat (widget)", stats.sourceBreakdown.voice + stats.sourceBreakdown.widget, "bg-purple-500"],
                  ["Czat (web)", stats.sourceBreakdown.web, "bg-blue-500"],
                  ["SMS", stats.sourceBreakdown.sms, "bg-amber-500"],
                ].map((item) => {
                  const label = item[0] as string;
                  const value = item[1] as number;
                  const color = item[2] as string;
                  const max = Math.max(stats.sourceBreakdown.phone + stats.sourceBreakdown.voice + stats.sourceBreakdown.widget + stats.sourceBreakdown.web + stats.sourceBreakdown.sms, 1);
                  return (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="w-32 text-zinc-500 shrink-0">{label}</span>
                      <div className="flex-1 h-4 bg-brand-50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-medium text-zinc-700">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Classification */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Klasyfikacja rozmów</h3>
              {stats.totalCalls > 0 ? (
                <div className="space-y-2">
                  {[
                    { label: "Zamówienia", value: stats.orders, color: "bg-green-500" },
                    { label: "Zapytania", value: stats.inquiries, color: "bg-blue-500" },
                    { label: "Rezerwacje", value: stats.bookings, color: "bg-purple-500" },
                    { label: "Spam", value: stats.spam, color: "bg-red-500" },
                    { label: "Inne", value: stats.totalCalls - stats.orders - stats.inquiries - stats.bookings - stats.spam, color: "bg-brand-200" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-zinc-500">{item.label}</span>
                      <div className="flex-1 h-4 bg-brand-50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max((item.value / stats.totalCalls) * 100, 1)}%` }} />
                      </div>
                      <span className="w-8 text-right font-medium text-zinc-700">{item.value}</span>
                      <span className="w-10 text-right text-zinc-400">{((item.value / stats.totalCalls) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">Brak danych</p>
              )}
            </div>
          </div>

          {/* ── Hourly chart + Daily trend ── */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Rozmowy w ciągu doby</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {stats.hours24.map(h => (
                  <div key={h.hour} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-right text-zinc-400 shrink-0 font-mono">{h.hour}</span>
                    <div className="flex-1 h-5 bg-brand-50 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400/80 rounded-full transition-all" style={{ width: `${(h.count / maxHourly) * 100}%`, minWidth: h.count ? 4 : 0 }} />
                    </div>
                    <span className="w-6 text-left text-zinc-500 font-medium">{h.count || ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Trend dzienny</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {[...stats.dailyData].reverse().map(d => {
                  const max = Math.max(...stats.dailyData.map(x => x.calls + x.convos), 1);
                  return (
                    <div key={d.date} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-zinc-400 shrink-0 font-mono">{d.date.slice(5)}</span>
                      <div className="flex-1 h-5 bg-brand-50 rounded-full overflow-hidden flex">
                        <div className="h-full bg-brand-400/80 rounded-l-full transition-all" style={{ width: `${(d.calls / max) * 100}%`, minWidth: d.calls ? 4 : 0 }} />
                        <div className="h-full bg-blue-400/60 rounded-r-full transition-all" style={{ width: `${(d.convos / max) * 100}%`, minWidth: d.convos ? 4 : 0 }} />
                      </div>
                      <span className="w-14 text-right text-zinc-500 font-medium">{d.calls + d.convos}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-brand-400" /> Rozmowy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400/60" /> Czaty</span>
              </div>
            </div>
          </div>

          {/* ── Per-business breakdown ── */}
          {businessId === "all" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Podsumowanie per firma</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white text-left">
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Firma</th>
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Rozmowy</th>
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Czaty</th>
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Minuty</th>
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Koszt</th>
                      <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Zamówienia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.bizBreakdown.map(b => (
                      <tr key={b.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50 cursor-pointer"
                        onClick={() => setBusinessId(b.id)}>
                        <td className="px-3 py-2 font-medium text-zinc-900">{b.name}</td>
                        <td className="px-3 py-2">{b.calls}</td>
                        <td className="px-3 py-2">{b.conversations}</td>
                        <td className="px-3 py-2">{b.minutes}</td>
                        <td className="px-3 py-2">{b.cost} PLN</td>
                        <td className="px-3 py-2 font-semibold text-green-600">{b.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Top callers ── */}
          {stats.topCallers.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Najczęściej dzwoniący</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-white text-left">
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Numer</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Rozmów</th>
                  </tr></thead>
                  <tbody>
                    {stats.topCallers.map(([num, count]) => (
                      <tr key={num} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50">
                        <td className="px-3 py-2 font-mono text-zinc-900">{num}</td>
                        <td className="px-3 py-2 font-semibold">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Detailed call logs table ── */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">Szczegółowe logi rozmów</h3>
              <span className="text-xs text-zinc-400">{filtered.length} rekordów</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Szukaj firmę lub numer..."
                className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-brand-400/20" />
              <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs">
                <option value="all">Wszystkie klasyfikacje</option>
                <option value="order">Zamówienia</option>
                <option value="inquiry">Zapytania</option>
                <option value="question">Pytania</option>
                <option value="booking">Rezerwacje</option>
                <option value="spam">Spam</option>
                <option value="unknown">Inne</option>
              </select>

              <span className="text-xs text-zinc-300">|</span>
              <span className="text-xs text-zinc-500">Sortuj:</span>
              {(["date", "duration", "cost"] as const).map(s => (
                <button key={s} onClick={() => { if (sortKey === s) setSortAsc(!sortAsc); else { setSortKey(s); setSortAsc(s === "date"); } }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                    sortKey === s ? "bg-brand-100 text-brand-700" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"
                  }`}>
                  {s === "date" ? "Data" : s === "duration" ? "Czas" : "Koszt"}
                  {sortKey === s && <span>{sortAsc ? "↑" : "↓"}</span>}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white text-left">
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Firma</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Data</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Numer</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Czas</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Koszt</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Klasyfikacja</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Podsumowanie</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(r => (
                    <tr key={r.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50">
                      <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{r.business_name}</td>
                      <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-3 py-2 font-mono text-zinc-700">{r.from_number}</td>
                      <td className="px-3 py-2 font-mono text-zinc-700">{fmtTime(r.duration_seconds)}</td>
                      <td className="px-3 py-2 font-mono text-zinc-700">{r.cost_pln.toFixed(2)} PLN</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.classification === "order" ? "bg-green-100 text-green-700" :
                          r.classification === "spam" ? "bg-red-100 text-red-700" :
                          r.classification === "booking" ? "bg-purple-100 text-purple-700" :
                          r.classification === "inquiry" || r.classification === "question" ? "bg-blue-100 text-blue-700" :
                          "bg-brand-50 text-zinc-500"
                        }`}>{r.classification}</span>
                      </td>
                      <td className="px-3 py-2 text-zinc-400 max-w-[200px] truncate">{r.summary || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <span>Strona {safePage + 1} z {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}
                    className="px-3 py-1 rounded bg-brand-50 hover:bg-brand-100 disabled:opacity-30 font-medium">← Poprzednia</button>
                  <button disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}
                    className="px-3 py-1 rounded bg-brand-50 hover:bg-brand-100 disabled:opacity-30 font-medium">Następna →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
