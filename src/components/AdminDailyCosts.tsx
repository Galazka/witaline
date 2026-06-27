"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlanConfig } from "@/lib/pricing";
import { getExchangeRates } from "@/lib/exchange-rates";

function fmt(v: number): string {
  const s = Math.abs(v).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? "-" : ""}${s} zł`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

function fmtDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function fmtDateFull(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function daysInMonth(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function endOfMonth(): string {
  const d = new Date();
  d.setDate(daysInMonth(d));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayOfMonth(d: string): number {
  return parseInt(d.slice(8, 10), 10);
}

function getPlanRevenue(planKey: string): number {
  if (planKey === "elastic_0" || planKey === "self_service") return 0;
  const cfg = getPlanConfig(planKey);
  return cfg?.price ?? 199;
}

interface CallLog {
  id: string;
  business_id: string;
  business_name?: string;
  duration_seconds: number;
  cost_elevenlabs: number;
  cost_twilio: number;
  cost_openrouter: number;
  consultant_transfer_cost_pln: number;
  total_cost: number;
  revenue_pln: number;
  plan_revenue_pln: number;
  internal_cost_pln: number;
  from_number: string;
  created_at: string;
  classification: string;
}

interface DailyGroup {
  date: string;
  calls: CallLog[];
  totalMinutes: number;
  totalCost: number;
  totalElevenlabs: number;
  totalTwilio: number;
  totalOpenrouter: number;
  totalConsultantTransfer: number;
  totalRevenue: number;
  profit: number;
}

export default function AdminDailyCosts() {
  type ViewCurrency = "PLN" | "EUR" | "USD";
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [currency, setCurrency] = useState<ViewCurrency>("PLN");
  const [rates, setRates] = useState<{ usdPln: number; eurPln: number } | null>(null);

  useEffect(() => {
    getExchangeRates().then((r) => {
      setRates({ usdPln: r.usdPln, eurPln: r.eurPln });
    });
  }, []);

  const fmt = (v: number): string => {
    if (currency === "PLN") {
      const s = Math.abs(v).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return v < 0 ? `-${s} zl` : `${s} zl`;
    }
    const rate = currency === "EUR" ? (rates?.eurPln || 4.52) : (rates?.usdPln || 4.15);
    const converted = Math.abs(v) / rate;
    const s = converted.toFixed(2).replace(".", ",");
    const sym = currency === "EUR" ? "€" : "$";
    return `${v < 0 ? "-" : ""}${s} ${sym}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/admin/real-costs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const json = res.ok ? await res.json() : { call_logs: [] };
      if (!res.ok) {
        setFetchError(`Błąd ${res.status} — ${json.error || "brak dostępu"}`);
      } else {
        const logs: CallLog[] = (json.call_logs || []).map((l: Record<string, unknown>) => ({
          ...l,
          cost_elevenlabs: Number(l.cost_elevenlabs) || 0,
          cost_twilio: Number(l.cost_twilio) || 0,
          cost_openrouter: Number(l.cost_openrouter) || 0,
          consultant_transfer_cost_pln: Number(l.consultant_transfer_cost_pln) || 0,
          total_cost: Number(l.total_cost) || Number(l.cost_pln) || 0,
          revenue_pln: Number(l.revenue_pln) || 0,
          plan_revenue_pln: Number(l.plan_revenue_pln) || 0,
          internal_cost_pln: Number(l.internal_cost_pln) || 0.65 * ((Number(l.duration_seconds) || 0) / 60),
        }));
        setCallLogs(logs);
        setSmsTotal(json.sms_total || 0);
        setCostSmsTotal(json.cost_sms_total || 0);
      }
    } catch (e) {
      setFetchError("Nie udało się połączyć z API");
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("Pobieranie rozmów z ElevenLabs...");
    setFetchError("");
    try {
      const r1 = await fetch("/api/admin/sync-calls", { method: "POST" });
      const d1 = await r1.json();
      setSyncMsg("Synchronizowanie kosztów...");
      const r2 = await fetch("/api/admin/sync-costs", { method: "POST" });
      const d2 = await r2.json();
      setSyncMsg((d2 as any).message || "OK");
      await fetchData();
    } catch {
      setSyncMsg("Błąd synchronizacji");
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 8000);
  }

  // Group by day
  const days = new Map<string, CallLog[]>();
  for (const log of callLogs) {
    const day = log.created_at?.slice(0, 10) || "nieznany";
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(log);
  }

  const dailyGroups: DailyGroup[] = [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, calls]) => {
      const totalMinutes = calls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / 60;
      const totalCost = calls.reduce((s, c) => s + (c.total_cost || 0), 0);
      const totalElevenlabs = calls.reduce((s, c) => s + c.cost_elevenlabs, 0);
      const totalTwilio = calls.reduce((s, c) => s + c.cost_twilio, 0);
      const totalOpenrouter = calls.reduce((s, c) => s + c.cost_openrouter, 0);
      const totalConsultantTransfer = calls.reduce((s, c) => s + (c.consultant_transfer_cost_pln || 0), 0);
      const totalRevenue = calls.reduce((s, c) => s + (c.plan_revenue_pln || 0), 0);
      const profit = totalRevenue - totalCost;
      return { date, calls, totalMinutes, totalCost, totalElevenlabs, totalTwilio, totalOpenrouter, totalConsultantTransfer, totalRevenue, profit };
    });

  const today = todayStr();
  const currentDay = dayOfMonth(today);
  const totalDays = daysInMonth();
  const daysElapsed = Math.min(currentDay, totalDays);
  const daysRemaining = totalDays - daysElapsed;

  // Totals
  const totalMinutes = dailyGroups.reduce((s, d) => s + d.totalMinutes, 0);
  const totalCost = dailyGroups.reduce((s, d) => s + d.totalCost, 0);
  const totalRevenue = dailyGroups.reduce((s, d) => s + d.totalRevenue, 0);
  const totalProfit = dailyGroups.reduce((s, d) => s + d.profit, 0);
  const totalCalls = callLogs.length;

  // SMS summary from API
  const [smsTotal, setSmsTotal] = useState(0);
  const [costSmsTotal, setCostSmsTotal] = useState(0);

  // Projections
  const avgProfitPerDay = daysElapsed > 0 ? totalProfit / daysElapsed : 0;
  const projectedProfit = avgProfitPerDay * totalDays;
  const projectedRevenue = daysElapsed > 0 ? (totalRevenue / daysElapsed) * totalDays : 0;
  const projectedCost = daysElapsed > 0 ? (totalCost / daysElapsed) * totalDays : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Od:</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-700 focus:outline-none focus:border-[#0d9488]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Do:</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-700 focus:outline-none focus:border-[#0d9488]" />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "PLN" | "EUR" | "USD")}
            className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-700 bg-white focus:outline-none focus:border-[#0d9488]"
            title="Wyświetl w">
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
          <button onClick={fetchData}
            className="px-3 py-1.5 text-xs font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition">
            Odśwież
          </button>
          <button onClick={handleSync} disabled={syncing}
            className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50">
            {syncing ? "Sync..." : "Sync koszty"}
          </button>
          {syncMsg && (
            <span className={`text-xs ${syncing ? "text-amber-500" : "text-green-600"}`}>
              {syncing ? "⏳ " : "✓ "}{syncMsg}
            </span>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={fetchData} className="text-red-600 font-medium hover:text-red-800 underline ml-2">Spróbuj ponownie</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="bg-white rounded-lg border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Rozmowy</p>
          <p className="text-lg font-bold text-zinc-900">{totalCalls}</p>
          <p className="text-[10px] text-zinc-400">{Math.round(totalMinutes)} min</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Koszt</p>
          <p className="text-lg font-bold text-red-500">{fmt(totalCost)}</p>
          <p className="text-[10px] text-zinc-400">{totalMinutes > 0 ? fmt(totalCost / totalMinutes) + "/min" : "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Przychód</p>
          <p className="text-lg font-bold text-[#0d9488]">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Wynik</p>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
            {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
          </p>
          <p className="text-[10px] text-zinc-400">{totalRevenue > 0 ? fmtPct((totalProfit / totalRevenue) * 100) : "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Dni</p>
          <p className="text-lg font-bold text-zinc-900">{daysElapsed}/{totalDays}</p>
          <p className="text-[10px] text-zinc-400">{daysRemaining} pozostało</p>
        </div>
        <div className="bg-brand-50 rounded-lg border border-[#0d9488]/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Prognoza przychód</p>
          <p className="text-lg font-bold text-[#0d9488]">{fmt(projectedRevenue)}</p>
        </div>
        <div className="bg-brand-50 rounded-lg border border-[#0d9488]/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Prognoza koszt</p>
          <p className="text-lg font-bold text-amber-600">{fmt(projectedCost)}</p>
        </div>
        <div className={`rounded-lg border p-3 ${projectedProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Prognoza wynik</p>
          <p className={`text-lg font-bold ${projectedProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
            {projectedProfit >= 0 ? "+" : ""}{fmt(projectedProfit)}
          </p>
          <p className="text-[10px] text-zinc-400">{projectedRevenue > 0 ? fmtPct((projectedProfit / projectedRevenue) * 100) : "—"}</p>
        </div>
      </div>

      {/* SMS KPI */}
      <div className="bg-white rounded-lg border border-zinc-200 p-3 w-fit">
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">SMS wysłane</p>
        <p className="text-lg font-bold text-zinc-900">{smsTotal}</p>
        <p className="text-[10px] text-zinc-400">koszt: {fmt(costSmsTotal)}</p>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-200 bg-zinc-50">
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider">Dzień</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Rozmowy</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Minuty</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">ElevenLabs</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Twilio</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">OpenRouter</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Koszt</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Przychód</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Wynik</th>
                <th className="p-2.5 font-semibold text-[10px] uppercase tracking-wider text-right">Marża</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-zinc-400">Ładowanie...</td></tr>
              ) : dailyGroups.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8">
                  <p className="text-zinc-400 mb-2">Brak danych w wybranym zakresie</p>
                  <button onClick={handleSync} disabled={syncing}
                    className="px-4 py-2 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50">
                    {syncing ? "Synchronizowanie..." : "Synchronizuj rozmowy z ElevenLabs"}
                  </button>
                </td></tr>
              ) : (
                dailyGroups.map((day) => {
                  const marginPct = day.totalRevenue > 0 ? (day.profit / day.totalRevenue) * 100 : 0;
                  const isExpanded = expandedDay === day.date;
                  const isToday = day.date === today;
                  return (
                    <>
                      <tr
                        key={day.date}
                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                        className={`border-b border-zinc-100 cursor-pointer hover:bg-[#f0fdfa]/50 transition ${isToday ? "bg-brand-50/30" : ""}`}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${day.profit >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="font-medium text-zinc-800">{fmtDateFull(day.date)}</span>
                            {isToday && <span className="text-[9px] bg-[#ccfbf1] text-[#0d9488] rounded-full px-1.5 py-0.5 font-semibold">Dziś</span>}
                          </div>
                        </td>
                        <td className="p-2.5 text-right text-zinc-700 font-medium">{day.calls.length}</td>
                        <td className="p-2.5 text-right text-zinc-600">{Math.round(day.totalMinutes)}</td>
                        <td className="p-2.5 text-right text-zinc-500">{fmt(day.totalElevenlabs)}</td>
                        <td className="p-2.5 text-right text-zinc-500">{fmt(day.totalTwilio)}</td>
                        <td className="p-2.5 text-right text-zinc-500">{fmt(day.totalOpenrouter)}</td>
                        <td className="p-2.5 text-right text-red-600 font-medium">{fmt(day.totalCost)}</td>
                        <td className="p-2.5 text-right text-[#0d9488] font-medium">{fmt(day.totalRevenue)}</td>
                        <td className={`p-2.5 text-right font-bold ${day.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {day.profit >= 0 ? "+" : ""}{fmt(day.profit)}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-1.5 bg-brand-50 rounded-full overflow-hidden hidden md:block">
                              <div className={`h-full rounded-full ${marginPct > 20 ? "bg-green-500" : marginPct >= 0 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }} />
                            </div>
                            <span className={`text-xs font-medium ${marginPct > 20 ? "text-green-600" : marginPct >= 0 ? "text-amber-600" : "text-red-500"}`}>
                              {fmtPct(marginPct)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded: per-call breakdown */}
                      {isExpanded && (
                        <tr key={`${day.date}-details`}>
                          <td colSpan={10} className="p-0 bg-zinc-50 border-b border-zinc-200">
                            <div className="p-3 space-y-1">
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-wider mb-2 font-semibold">
                                <span>Rozmowy dnia</span>
                                <span className="w-px h-3 bg-zinc-200" />
                                <span>{day.calls.length} rozmów</span>
                                <span className="w-px h-3 bg-zinc-200" />
                                <span>{Math.round(day.totalMinutes)} min łącznie</span>
                              </div>
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="text-zinc-400 border-b border-zinc-200">
                                    <th className="text-left pb-1 pr-2 font-medium">Godzina</th>
                                    <th className="text-left pb-1 pr-2 font-medium">Klient</th>
                                    <th className="text-right pb-1 pr-2 font-medium">Czas</th>
                                    <th className="text-right pb-1 pr-2 font-medium">ElevenLabs</th>
                                    <th className="text-right pb-1 pr-2 font-medium">Twilio</th>
                                    <th className="text-right pb-1 pr-2 font-medium">OpenRouter</th>
                                    <th className="text-right pb-1 pr-2 font-medium">Koszt</th>
                                    <th className="text-right pb-1 font-medium">Przychód</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {day.calls.map((call) => {
                                    const cost = call.total_cost || 0;
                                    const rev = call.revenue_pln || 0;
                                    const isCallExpanded = expandedCall === call.id;
                                    return (
                                      <>
                                        <tr
                                          key={call.id}
                                          onClick={() => setExpandedCall(isCallExpanded ? null : call.id)}
                                          className="border-b border-zinc-100 hover:bg-white cursor-pointer"
                                        >
                                          <td className="py-1.5 pr-2 text-zinc-600 whitespace-nowrap">
                                            {call.created_at?.slice(11, 16) || "—"}
                                          </td>
                                          <td className="py-1.5 pr-2 text-zinc-700 truncate max-w-[120px]">
                                            {call.from_number || call.business_name || "—"}
                                          </td>
                                          <td className="py-1.5 pr-2 text-right text-zinc-600">{fmtTime(call.duration_seconds || 0)}</td>
                                          <td className="py-1.5 pr-2 text-right text-zinc-500">{fmt(call.cost_elevenlabs)}</td>
                                          <td className="py-1.5 pr-2 text-right text-zinc-500">{fmt(call.cost_twilio)}</td>
                                          <td className="py-1.5 pr-2 text-right text-zinc-500">{fmt(call.cost_openrouter)}</td>
                                          <td className="py-1.5 pr-2 text-right text-red-500 font-medium">{fmt(cost)}</td>
                                          <td className="py-1.5 text-right text-[#0d9488] font-medium">{rev > 0 ? fmt(rev) : "—"}</td>
                                        </tr>
                                        {isCallExpanded && call.business_name && (
                                          <tr key={`${call.id}-meta`}>
                                            <td colSpan={8} className="pb-2">
                                              <div className="flex items-center gap-4 text-[10px] text-zinc-400 ml-4">
                                                <span>Firma: <strong className="text-zinc-600">{call.business_name}</strong></span>
                                                {call.classification && (
                                                  <span>Klasyfikacja: <strong className="text-zinc-600">{call.classification}</strong></span>
                                                )}
                                                <span>ID: <code className="text-zinc-500">{call.id.slice(0, 8)}...</code></span>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
            {/* Footer row with totals */}
            {dailyGroups.length > 0 && !loading && (
              <tfoot>
                <tr className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold">
                  <td className="p-2.5 text-zinc-800">SUMA</td>
                  <td className="p-2.5 text-right text-zinc-800">{totalCalls}</td>
                  <td className="p-2.5 text-right text-zinc-800">{Math.round(totalMinutes)}</td>
                  <td className="p-2.5 text-right text-zinc-600">{fmt(dailyGroups.reduce((s, d) => s + d.totalElevenlabs, 0))}</td>
                  <td className="p-2.5 text-right text-zinc-600">{fmt(dailyGroups.reduce((s, d) => s + d.totalTwilio, 0))}</td>
                  <td className="p-2.5 text-right text-zinc-600">{fmt(dailyGroups.reduce((s, d) => s + d.totalOpenrouter, 0))}</td>
                  <td className="p-2.5 text-right text-red-600">{fmt(totalCost)}</td>
                  <td className="p-2.5 text-right text-[#0d9488]">{fmt(totalRevenue)}</td>
                  <td className={`p-2.5 text-right ${totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
                  </td>
                  <td className="p-2.5 text-right">
                    <span className={`${totalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {totalRevenue > 0 ? fmtPct((totalProfit / totalRevenue) * 100) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Projection row */}
                <tr className="border-t border-zinc-200 bg-brand-50/50 text-xs">
                  <td className="p-2.5 text-brand-700 font-semibold">PROGNOZA (koniec miesiąca)</td>
                  <td className="p-2.5 text-right text-brand-700 font-medium">
                    {daysElapsed > 0 ? Math.round((totalCalls / daysElapsed) * totalDays) : "—"}
                  </td>
                  <td className="p-2.5 text-right text-brand-700 font-medium">
                    {daysElapsed > 0 ? Math.round((totalMinutes / daysElapsed) * totalDays) : "—"}
                  </td>
                  <td className="p-2.5 text-right text-zinc-500">—</td>
                  <td className="p-2.5 text-right text-zinc-500">—</td>
                  <td className="p-2.5 text-right text-zinc-500">—</td>
                  <td className="p-2.5 text-right text-amber-600 font-medium">{fmt(projectedCost)}</td>
                  <td className="p-2.5 text-right text-[#0d9488] font-medium">{fmt(projectedRevenue)}</td>
                  <td className={`p-2.5 text-right font-bold ${projectedProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {projectedProfit >= 0 ? "+" : ""}{fmt(projectedProfit)}
                  </td>
                  <td className="p-2.5 text-right">
                    <span className={`${projectedProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {projectedRevenue > 0 ? fmtPct((projectedProfit / projectedRevenue) * 100) : "—"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
