"use client";

import { useEffect, useState, useCallback } from "react";

interface HourlyData { hour: string; count: number }
interface DailyData { date: string; calls: number; convos: number }

interface Stats {
  totalCalls: number;
  totalConversations: number;
  todayCalls: number;
  orders: number;
  inquiries: number;
  spam: number;
  bookings: number;
  avgDuration: number;
  totalMinutes: number;
  totalCost: string;
  hours24: HourlyData[];
  dailyData: DailyData[];
  topCallers: [string, number][];
  range: string;
}

type Range = "7" | "30" | "90" | "all" | "custom";

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>("7");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchStats = useCallback(async (r: Range, from?: string, to?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (r === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    } else {
      params.set("range", r);
    }
    try {
      const res = await fetch(`/api/admin/stats?${params}`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (range === "custom" && fromDate && toDate) {
      fetchStats("custom", fromDate, toDate);
    } else if (range !== "custom") {
      fetchStats(range);
    }
  }, [range, fetchStats]);

  function handleRefresh() {
    setRefreshing(true);
    if (range === "custom" && fromDate && toDate) {
      fetchStats("custom", fromDate, toDate);
    } else {
      fetchStats(range);
    }
  }

  function handleRangeChange(newRange: Range) {
    setRange(newRange);
    if (newRange !== "custom") {
      setFromDate("");
      setToDate("");
    }
  }

  function exportCSV() {
    if (!stats) return;
    const rows = [["Data", "Rozmowy", "Czaty", "Razem"]];
    stats.dailyData.forEach(d => {
      rows.push([d.date, String(d.calls), String(d.convos), String(d.calls + d.convos)]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witaline-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isLoading = loading || refreshing;

  if (isLoading && !stats) return <p className="text-center text-zinc-400 py-8">Ładowanie statystyk...</p>;

  const maxHourly = stats ? Math.max(...stats.hours24.map(h => h.count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {([["7", "7 dni"], ["30", "30 dni"], ["90", "90 dni"], ["all", "Wszystko"]] as [Range, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleRangeChange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${range === key ? "bg-[#0d9488] text-white" : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"}`}
            >
              {label}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs" />
            <span className="text-xs text-zinc-400">—</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs" />
            <button
              onClick={() => { if (fromDate && toDate) { setRange("custom"); fetchStats("custom", fromDate, toDate); } }}
              disabled={!fromDate || !toDate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition disabled:opacity-50"
            >
              Filtruj
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={isLoading} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1] transition disabled:opacity-50">
            {refreshing ? "Odświeżanie..." : "🔄 Odśwież"}
          </button>
          <button onClick={exportCSV} disabled={!stats} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1] transition disabled:opacity-50">
            📥 Export CSV
          </button>
        </div>
      </div>

      {!stats ? (
        <p className="text-center text-red-500 py-8">Błąd ładowania statystyk.</p>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ["📞", "Wszystkie", stats.totalCalls],
              ["📞", "Dziś", stats.todayCalls],
              ["⏱️", "Śr. czas", `${Math.floor(stats.avgDuration / 60)}:${String(stats.avgDuration % 60).padStart(2, "0")}`],
              ["💰", "Koszt", `${stats.totalCost} PLN`],
              ["🛒", "Zamówienia", stats.orders],
              ["📋", "Zapytania", stats.inquiries],
            ].map(([icon, label, value]) => (
              <div key={label} className="bg-white rounded-xl border border-zinc-200 p-4">
                <p className="text-xs text-zinc-400">{icon} {label}</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-400">🚫 Spam</p>
              <p className="text-lg font-bold text-red-500">{stats.spam}</p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-400">📅 Rezerwacje</p>
              <p className="text-lg font-bold text-[#0d9488]">{stats.bookings}</p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-400">💬 Czaty</p>
              <p className="text-lg font-bold text-zinc-900">{stats.totalConversations}</p>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-400">📊 Minuty</p>
              <p className="text-lg font-bold text-zinc-900">{stats.totalMinutes}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Rozmowy w ciągu doby</h3>
              <div className="space-y-1">
                {stats.hours24.map(h => (
                  <div key={h.hour} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-right text-zinc-400 shrink-0 font-mono">{h.hour}</span>
                    <div className="flex-1 h-5 bg-brand-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0d9488]/80 rounded-full transition-all" style={{ width: `${(h.count / maxHourly) * 100}%`, minWidth: h.count ? 4 : 0 }} />
                    </div>
                    <span className="w-6 text-left text-zinc-500 font-medium">{h.count || ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Rozmowy w okresie</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Data</th>
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Rozmowy</th>
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Czaty</th>
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Razem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dailyData.map(d => (
                      <tr key={d.date} className="border-b border-zinc-100 last:border-b-0 hover:bg-[#f0fdfa]">
                        <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{d.date}</td>
                        <td className="px-3 py-2">{d.calls}</td>
                        <td className="px-3 py-2">{d.convos}</td>
                        <td className="px-3 py-2 font-semibold">{d.calls + d.convos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top callers */}
          {stats.topCallers.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Najczęściej dzwoniący</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Numer</th>
                      <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Rozmów</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCallers.map(([num, count]) => (
                      <tr key={num} className="border-b border-zinc-100 last:border-b-0 hover:bg-[#f0fdfa]">
                        <td className="px-3 py-2 font-mono text-sm text-zinc-900 whitespace-nowrap">{num}</td>
                        <td className="px-3 py-2 font-semibold">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Classification breakdown (pie chart alternative) */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Klasyfikacja rozmów</h3>
            {stats.totalCalls > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Zamówienia", value: stats.orders, color: "bg-green-500" },
                  { label: "Zapytania", value: stats.inquiries, color: "bg-blue-500" },
                  { label: "Rezerwacje", value: stats.bookings, color: "bg-purple-500" },
                  { label: "Spam", value: stats.spam, color: "bg-red-500" },
                  { label: "Inne", value: stats.totalCalls - stats.orders - stats.inquiries - stats.bookings - stats.spam, color: "bg-brand-200" },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="w-full bg-brand-50 rounded-full h-3 mb-2">
                      <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${Math.max((item.value / stats.totalCalls) * 100, 1)}%` }} />
                    </div>
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="text-sm font-semibold text-zinc-900">{item.value}</p>
                    <p className="text-[10px] text-zinc-400">{((item.value / stats.totalCalls) * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 text-center py-4">Brak danych</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
