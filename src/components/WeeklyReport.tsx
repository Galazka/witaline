"use client";

import { useState, useEffect } from "react";

interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  total_calls: number;
  total_minutes: number;
  total_leads: number;
  total_bookings: number;
  total_sms: number;
  classification_breakdown: Record<string, number>;
  daily_breakdown: Record<string, { calls: number; leads: number }>;
  peak_day: string | null;
  peak_hour: string | null;
  previous_week: {
    total_calls: number;
    total_leads: number;
    total_bookings: number;
    total_sms: number;
  };
}

interface Props {
  businessId: string;
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return <span className="text-green-400 text-sm ml-1">↑</span>;
  if (current > previous) return <span className="text-green-400 text-sm ml-1">↑</span>;
  if (current < previous) return <span className="text-red-400 text-sm ml-1">↓</span>;
  return <span className="text-zinc-500 text-sm ml-1">→</span>;
}

const dayLabels: Record<string, string> = {
  "0": "Nd", "1": "Pn", "2": "Wt", "3": "Śr", "4": "Czw", "5": "Pt", "6": "Sb",
};

export default function WeeklyReport({ businessId }: Props) {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/business/weekly-report?businessId=${businessId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-white/55 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <p className="text-sm text-zinc-400">Ładowanie raportu...</p>
      </div>
    );
  }

  if (!data) return null;

  const entries = Object.entries(data.daily_breakdown);
  const maxCalls = Math.max(...entries.map(([, v]) => v.calls), 1);

  const sortedClassifications = Object.entries(data.classification_breakdown).sort(([, a], [, b]) => b - a);

  const classLabels: Record<string, string> = {
    order: "Zamówienie",
    booking: "Rezerwacja",
    question: "Pytanie",
    offer: "Oferta",
    spam: "Spam",
    unknown: "Inne",
  };

  return (
    <div className="bg-white/55 backdrop-blur-xl rounded-2xl border border-white/20 p-5 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Raport tygodniowy</h3>
        <span className="text-[10px] text-zinc-500">
          {new Date(data.weekStart).toLocaleDateString("pl-PL")} – {new Date(data.weekEnd).toLocaleDateString("pl-PL")}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/45 rounded-xl p-4 border border-white/20">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Rozmowy</p>
          <p className="text-2xl font-bold text-[#0d9488] mt-1">{data.total_calls}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
            {data.total_minutes} min
            <TrendArrow current={data.total_calls} previous={data.previous_week.total_calls} />
            <span className="text-zinc-600 ml-1">{data.previous_week.total_calls}</span>
          </p>
        </div>
        <div className="bg-white/45 rounded-xl p-4 border border-white/20">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Lead&apos;y</p>
          <p className="text-2xl font-bold text-[#0d9488] mt-1">{data.total_leads}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
            poprzedni
            <TrendArrow current={data.total_leads} previous={data.previous_week.total_leads} />
            <span className="text-zinc-600 ml-1">{data.previous_week.total_leads}</span>
          </p>
        </div>
        <div className="bg-white/45 rounded-xl p-4 border border-white/20">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Rezerwacje</p>
          <p className="text-2xl font-bold text-[#0d9488] mt-1">{data.total_bookings}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
            poprzedni
            <TrendArrow current={data.total_bookings} previous={data.previous_week.total_bookings} />
            <span className="text-zinc-600 ml-1">{data.previous_week.total_bookings}</span>
          </p>
        </div>
        <div className="bg-white/45 rounded-xl p-4 border border-white/20">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">SMS</p>
          <p className="text-2xl font-bold text-[#0d9488] mt-1">{data.total_sms}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
            poprzedni
            <TrendArrow current={data.total_sms} previous={data.previous_week.total_sms} />
            <span className="text-zinc-600 ml-1">{data.previous_week.total_sms}</span>
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Rozmowy dziennie</p>
        <div className="flex items-end gap-2 h-32">
          {entries.map(([dateStr, val]) => {
            const dayNum = new Date(dateStr + "T00:00:00").getDay().toString();
            const pct = maxCalls > 0 ? (val.calls / maxCalls) * 100 : 0;
            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-zinc-500">{val.calls}</span>
                <div className="w-full bg-brand-100 rounded-md overflow-hidden flex-1 self-end" style={{ width: "100%" }}>
                  <div
                    className="w-full bg-[#0d9488] rounded-md transition-all self-end"
                    style={{ height: `${Math.max(pct, 2)}%`, minHeight: val.calls > 0 ? "4px" : "0", marginTop: "auto" }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{dayLabels[dayNum] || dateStr.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Najczęstsze powody</p>
          {sortedClassifications.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Brak danych</p>
          ) : (
            <div className="space-y-1.5">
              {sortedClassifications.map(([key, count]) => {
                const total = data.total_calls || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-zinc-600 truncate">{classLabels[key] || key}</span>
                    <div className="flex-1 h-4 bg-brand-100 rounded overflow-hidden">
                      <div className="h-full bg-[#0d9488]/70 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-zinc-400">{count}</span>
                    <span className="w-8 text-right text-zinc-600">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Najwyższa aktywność</p>
          <div className="space-y-2">
            <div className="bg-white/45 rounded-lg p-3 border border-white/20">
              <p className="text-[10px] text-zinc-500 uppercase">Dzień</p>
              <p className="text-lg font-semibold text-zinc-900">{data.peak_day || "—"}</p>
            </div>
            <div className="bg-white/45 rounded-lg p-3 border border-white/20">
              <p className="text-[10px] text-zinc-500 uppercase">Godzina</p>
              <p className="text-lg font-semibold text-zinc-900">{data.peak_hour || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
