"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import AdminBusinessEditor from "./AdminBusinessEditor";
import { getPlanLabel } from "@/lib/pricing";

/* ── Types ── */

interface BusinessInfo {
  id: string; name: string; current_plan: string; subscription_status: string;
  suspended: boolean; trial_ends_at: string | null; subscription_current_period_end: string | null;
  minutes_used_this_week: number; tokens_used_this_month: number;
  monthlyMinutesLimit: number; monthlyTokensLimit: number;
  phone: string | null; twilio_number: string | null; industry: string | null;
  website_url: string | null; created_at: string; owner_uid: string;
}

interface DetailStat {
  totalCalls: number; totalConversations: number; totalMinutes: number;
  totalCost: string; orders: number; inquiries: number; bookings: number; spam: number;
  totalTokens: number; callTokens: number; convTokens: number;
}

interface DetailData {
  business: BusinessInfo;
  stats: DetailStat;
  sourceBreakdown: { phone: number; voice: number; web: number; widget: number; sms: number };
  callLogs: any[];
  conversations: any[];
  reservations: any[];
}

interface Props {
  businessId: string;
  onBack: () => void;
  onEdit?: (id: string) => void;
}

/* ── Helpers ── */

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const classificationStyle: Record<string, string> = {
  order: "bg-green-100 text-green-700",
  spam: "bg-red-100 text-red-700",
  booking: "bg-purple-100 text-purple-700",
  inquiry: "bg-blue-100 text-blue-700",
  question: "bg-blue-100 text-blue-700",
};

type DetailTab = "calls" | "reservations";

/* ── Component ── */

export default function AdminBusinessDetail({ businessId, onBack, onEdit }: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [callPage, setCallPage] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTab>("calls");
  const [showEditor, setShowEditor] = useState(false);
  const pageSize = 15;

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/business/${businessId}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) return <p className="text-center text-zinc-400 py-12">Ładowanie danych firmy...</p>;
  if (!data) return <p className="text-center text-red-500 py-12">Błąd ładowania danych.</p>;

  const { business, stats } = data;
  const minutesPct = business.monthlyMinutesLimit > 0 ? Math.min(100, Math.round((business.minutes_used_this_week / business.monthlyMinutesLimit) * 100)) : 0;
  const tokensPct = business.monthlyTokensLimit > 0 ? Math.min(100, Math.round((business.tokens_used_this_month / business.monthlyTokensLimit) * 100)) : 0;
  const statusBg: Record<string, string> = {
    trialing: "bg-blue-50 text-blue-700", active: "bg-green-50 text-green-700",
    past_due: "bg-red-50 text-red-700", canceled: "bg-brand-50 text-zinc-500",
  };

  const paged = data.callLogs.slice(callPage * pageSize, (callPage + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(data.callLogs.length / pageSize));

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
            ← Powrót
          </button>
          <span className="text-zinc-200">|</span>
          <h2 className="text-lg font-bold text-zinc-900">{business.name}</h2>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBg[business.subscription_status] || "bg-brand-50 text-zinc-500"}`}>
            {business.subscription_status === "trialing" ? "Test" : business.subscription_status === "active" ? "Aktywny" : business.subscription_status}
          </span>
          {business.suspended && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Zawieszona</span>}
        </div>
        {onEdit && (
          <button onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-brand-400 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition flex items-center gap-1.5">
            ✏️ Edytuj firmę
          </button>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          ["📞", "Rozmowy", stats.totalCalls],
          ["💬", "Czaty", stats.totalConversations],
          ["⏱️", "Minuty", stats.totalMinutes],
          ["💰", "Koszt", `${stats.totalCost} PLN`],
          ["🪙", "Tokeny", fmtNumber(stats.totalTokens)],
          ["🛒", "Zamówienia", stats.orders],
          ["📊", "Minuty/mies", `${business.minutes_used_this_week}/${business.monthlyMinutesLimit}`],
        ].map(([icon, label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-200 p-3">
            <p className="text-[10px] text-zinc-400">{icon} {label}</p>
            <p className="text-base font-bold text-zinc-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Usage bars */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-500 mb-2">⏱️ Minuty w pakiecie</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xl font-bold text-brand-500">{business.minutes_used_this_week}</span>
            <span className="text-sm text-zinc-400">/ {business.monthlyMinutesLimit} min</span>
          </div>
          <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${minutesPct > 90 ? "bg-red-500" : minutesPct > 75 ? "bg-amber-500" : "bg-brand-500"}`}
              style={{ width: `${minutesPct}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{minutesPct}% wykorzystano</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-500 mb-2">🪙 Tokeny w pakiecie</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xl font-bold text-purple-500">{fmtNumber(business.tokens_used_this_month)}</span>
            <span className="text-sm text-zinc-400">/ {fmtNumber(business.monthlyTokensLimit)} tok</span>
          </div>
          <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${tokensPct > 90 ? "bg-red-500" : tokensPct > 75 ? "bg-amber-500" : "bg-purple-500"}`}
              style={{ width: `${tokensPct}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{tokensPct}% wykorzystano</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Informacje o firmie</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Plan</p>
            <p className="font-medium text-zinc-900">{getPlanLabel(business.current_plan)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Branża</p>
            <p className="font-medium text-zinc-900">{business.industry || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Telefon</p>
            <p className="font-mono text-zinc-700">{business.phone || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Twilio</p>
            <p className="font-mono text-zinc-700">{business.twilio_number || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">WWW</p>
            <p className="truncate">{business.website_url || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Owner UID</p>
            <p className="font-mono text-xs text-zinc-500 truncate">{business.owner_uid.slice(0, 12)}...</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Konto od</p>
            <p className="text-zinc-900">{fmtDate(business.created_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase">Koniec okresu</p>
            <p className="text-zinc-900">{fmtDate(business.subscription_current_period_end || business.trial_ends_at)}</p>
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Źródła rozmów</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            ["📞", "Telefon", data.sourceBreakdown.phone],
            ["🎤", "Voice", data.sourceBreakdown.voice],
            ["💬", "Web", data.sourceBreakdown.web],
            ["🔗", "Widget", data.sourceBreakdown.widget],
            ["📱", "SMS", data.sourceBreakdown.sms],
          ].map(([icon, label, count]) => (
            <div key={label} className="bg-white rounded-lg p-3">
              <p className="text-lg">{icon}</p>
              <p className="text-sm font-bold text-zinc-900">{count}</p>
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail tabs: calls / reservations */}
      <div className="flex gap-1 bg-brand-50 p-1 rounded-lg w-fit">
        {[
          { key: "calls" as DetailTab, label: `📞 Rozmowy (${data.callLogs.length})` },
          { key: "reservations" as DetailTab, label: `📅 Rezerwacje (${data.reservations.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setDetailTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${detailTab === t.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CALL LOGS ── */}
      {detailTab === "calls" && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase w-8"></th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Data</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Numer</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Czas</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Koszt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Tokeny</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Klasyfikacja</th>
                  <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Podsumowanie</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-zinc-400">Brak rozmów</td></tr>
                ) : paged.map((log: any) => {
                  const isExpanded = expandedLog === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="px-3 py-2 text-zinc-300">{isExpanded ? "▼" : "▶"}</td>
                        <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-3 py-2 font-mono text-zinc-700">{log.from_number || log.caller_id}</td>
                        <td className="px-3 py-2 font-mono text-zinc-700">{fmtDuration(log.duration_seconds || 0)}</td>
                        <td className="px-3 py-2 font-mono text-zinc-700">{Number(log.cost_pln || 0).toFixed(2)} PLN</td>
                        <td className="px-3 py-2">
                          <span className="text-purple-600 font-medium">{log.tokens_total || Math.ceil(((log.duration_seconds || 0) / 60) * 1000)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${classificationStyle[log.classification] || "bg-brand-50 text-zinc-600"}`}>
                            {log.classification}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-400 max-w-[200px] truncate">{log.ai_summary || "—"}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="bg-white">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-3 max-w-3xl">
                              {/* Summary */}
                              <div>
                                <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-1">Podsumowanie AI</p>
                                <p className="text-sm text-zinc-800 whitespace-pre-wrap">{log.ai_summary || "Brak podsumowania"}</p>
                              </div>
                              {/* Transcript */}
                              {log.transcript ? (
                                <div>
                                  <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-1">Transkrypcja</p>
                                  <div className="bg-white border border-zinc-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                                    <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">{log.transcript}</pre>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 italic">Brak transkrypcji</p>
                              )}
                              {/* Recording */}
                              {log.recording_url && (
                                <div>
                                  <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-1">Nagranie</p>
                                  <audio controls src={log.recording_url} className="w-full max-w-md h-8" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.callLogs.length > pageSize && (
            <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
              <span>Strona {callPage + 1} z {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={callPage === 0} onClick={() => setCallPage(callPage - 1)}
                  className="px-3 py-1 rounded bg-brand-50 hover:bg-brand-100 disabled:opacity-30 font-medium">← Poprzednia</button>
                <button disabled={callPage >= totalPages - 1} onClick={() => setCallPage(callPage + 1)}
                  className="px-3 py-1 rounded bg-brand-50 hover:bg-brand-100 disabled:opacity-30 font-medium">Następna →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESERVATIONS ── */}
      {detailTab === "reservations" && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          {data.reservations.length === 0 ? (
            <p className="text-center text-zinc-400 py-8 text-sm">Brak rezerwacji</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white text-left">
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Data</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Klient</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Telefon</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Usługa</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Czas trwania</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Notatki</th>
                    <th className="px-3 py-2 font-semibold text-zinc-500 uppercase">Rozmowa</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reservations.map((r: any) => (
                    <tr key={r.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50">
                      <td className="px-3 py-2 text-zinc-700 whitespace-nowrap">{fmtDateTime(r.reserved_at)}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900">{r.caller_name || "—"}</td>
                      <td className="px-3 py-2 font-mono text-zinc-600">{r.caller_phone || "—"}</td>
                      <td className="px-3 py-2 text-zinc-700">{r.service_type || "—"}</td>
                      <td className="px-3 py-2 text-zinc-600">{r.duration_minutes ? `${r.duration_minutes} min` : "—"}</td>
                      <td className="px-3 py-2 text-zinc-400 max-w-[200px] truncate">{r.notes || "—"}</td>
                      <td className="px-3 py-2">
                        {r.call_logs ? (
                          <span className="text-[10px] text-zinc-500">
                            {r.call_logs.classification} — {(r.call_logs.ai_summary || "").slice(0, 60)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Helpdesk Editor modal */}
      {showEditor && onEdit && (
        <AdminBusinessEditor
          businessId={businessId}
          onClose={() => setShowEditor(false)}
          onSaved={() => { setShowEditor(false); fetchDetail(); }}
        />
      )}
    </div>
  );
}
