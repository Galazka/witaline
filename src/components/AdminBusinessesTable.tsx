"use client";

import { useState, useEffect, useMemo } from "react";
import { getPlanLabel } from "@/lib/pricing";

/* ── Types ── */
interface BizStats {
  totalCalls: number;
  orders: number;
  spam: number;
  bookings: number;
  smsCount: number;
  totalMinutes: number;
  totalCost: string;
  peakHour: string;
  transfers: number;
}

interface BizRecord {
  id: string;
  name: string;
  owner_uid: string;
  twilio_number: string | null;
  current_plan: string;
  minutes_used_this_week: number;
  subscription_status: string;
  suspended: boolean;
  industry: string | null;
  website_url: string | null;
  phone: string | null;
  consultant_count: number;
  ported_phone: string | null;
  port_status: string | null;
  created_at: string;
  trial_ends_at: string | null;
  subscription_current_period_end: string | null;
  stats: BizStats;
}

interface Props {
  onEdit: (id: string) => void;
  onRefresh: () => void;
  onDetail?: (id: string) => void;
}

function getPlanList() {
  return ["elastic_0", "enterprise_2000"];
}

/* ── Helpers ── */

/** Dni do końca okresu + kolor + label */
function periodInfo(endDate: string | null, status: string): { days: number | null; color: string; bgClass: string; textClass: string; label: string } {
  if (!endDate) {
    if (status === "trialing") return { days: null, color: "#a1a1aa", bgClass: "bg-brand-100", textClass: "text-zinc-400", label: "Brak daty" };
    if (status === "active") return { days: null, color: "#22c55e", bgClass: "bg-green-200", textClass: "text-green-600", label: "Bezterminowo" };
    return { days: null, color: "#a1a1aa", bgClass: "bg-brand-100", textClass: "text-zinc-400", label: "—" };
  }

  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diffMs = end - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return { days, color: "#ef4444", bgClass: "bg-red-100", textClass: "text-red-600", label: "Wygasło" };
  if (days <= 3) return { days, color: "#ef4444", bgClass: "bg-red-50", textClass: "text-red-600", label: `${days} dni` };
  if (days <= 7) return { days, color: "#f97316", bgClass: "bg-orange-50", textClass: "text-orange-600", label: `${days} dni` };
  if (days <= 14) return { days, color: "#eab308", bgClass: "bg-amber-50", textClass: "text-amber-600", label: `${days} dni` };
  return { days, color: "#22c55e", bgClass: "bg-green-50", textClass: "text-green-600", label: `${days} dni` };
}

function statusConfig(status: string, suspended: boolean) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    trialing: { label: "Test", bg: "bg-blue-50", text: "text-blue-700" },
    active: { label: "Aktywny", bg: "bg-green-50", text: "text-green-700" },
    past_due: { label: "Zaległy", bg: "bg-red-50", text: "text-red-700" },
    canceled: { label: "Anulowany", bg: "bg-brand-50", text: "text-zinc-500" },
    incomplete: { label: "Niekompletny", bg: "bg-brand-50", text: "text-zinc-500" },
  };
  const cfg = map[status] || { label: status, bg: "bg-brand-50", text: "text-zinc-500" };
  if (suspended) return { ...cfg, label: cfg.label + " (zaw.)", bg: "bg-red-50", text: "text-red-600" };
  return cfg;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

/** Procent okresu (trial lub subskrypcja) */
function periodProgress(endDate: string | null, startDate: string | null): number {
  if (!endDate || !startDate) return 0;
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const total = end - start;
  const elapsed = now - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/* ── Component ── */

export default function AdminBusinessesTable({ onEdit, onRefresh, onDetail }: Props) {
  const [businesses, setBusinesses] = useState<BizRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "stats.totalCalls" | "stats.totalMinutes" | "subscription_status" | "days_remaining">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/business-stats")
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => { setBusinesses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setBusinesses([]); setLoading(false); });
  }, []);

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/businesses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setBusinesses(prev => prev.filter(b => b.id !== id));
        onRefresh();
      }
    } catch { /* ignore */ }
    setDeleting(false);
    setDeleteConfirm(null);
  }

  const filtered = useMemo(() => {
    return businesses
      .filter(b => {
        if (!search) return true;
        const q = search.toLowerCase();
        return b.name.toLowerCase().includes(q)
          || b.owner_uid?.toLowerCase().includes(q)
          || b.twilio_number?.includes(q)
          || b.phone?.includes(q)
          || b.industry?.toLowerCase().includes(q)
          || b.subscription_status?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let cmp = 0;
        const mul = sortDir === "asc" ? 1 : -1;
        if (sortBy === "name") cmp = a.name.localeCompare(b.name);
        else if (sortBy === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        else if (sortBy === "stats.totalCalls") cmp = a.stats.totalCalls - b.stats.totalCalls;
        else if (sortBy === "stats.totalMinutes") cmp = a.stats.totalMinutes - b.stats.totalMinutes;
        else if (sortBy === "subscription_status") {
          const order = { trialing: 0, active: 1, past_due: 2, canceled: 3, incomplete: 4 };
          cmp = (order[a.subscription_status as keyof typeof order] ?? 99) - (order[b.subscription_status as keyof typeof order] ?? 99);
        } else if (sortBy === "days_remaining") {
          const aEnd = a.trial_ends_at || a.subscription_current_period_end;
          const bEnd = b.trial_ends_at || b.subscription_current_period_end;
          const aDays = aEnd ? Math.ceil((new Date(aEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 9999;
          const bDays = bEnd ? Math.ceil((new Date(bEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 9999;
          cmp = aDays - bDays;
        }
        return cmp * mul;
      });
  }, [businesses, search, sortBy, sortDir]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    const total = businesses.length;
    const trialing = businesses.filter(b => b.subscription_status === "trialing").length;
    const active = businesses.filter(b => b.subscription_status === "active").length;
    const pastDue = businesses.filter(b => b.subscription_status === "past_due").length;
    const canceled = businesses.filter(b => b.subscription_status === "canceled").length;
    const suspended = businesses.filter(b => b.suspended).length;
    const endingSoon = businesses.filter(b => {
      const end = b.trial_ends_at || b.subscription_current_period_end;
      if (!end) return false;
      const days = Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    }).length;
    const expired = businesses.filter(b => {
      const end = b.trial_ends_at || b.subscription_current_period_end;
      if (!end) return false;
      return new Date(end).getTime() <= Date.now();
    }).length;
    return { total, trialing, active, pastDue, canceled, suspended, endingSoon, expired };
  }, [businesses]);

  if (loading) return <p className="text-center text-zinc-400 py-8">Ładowanie firm...</p>;

  return (
    <div className="space-y-4">
      {/* ── Subscription summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Wszystkie", value: summary.total, color: "bg-brand-50 text-zinc-700" },
          { label: "Test", value: summary.trialing, color: "bg-blue-50 text-blue-700" },
          { label: "Aktywne", value: summary.active, color: "bg-green-50 text-green-700" },
          { label: "Zaległe", value: summary.pastDue, color: "bg-red-50 text-red-700" },
          { label: "Anulowane", value: summary.canceled, color: "bg-brand-50 text-zinc-500" },
          { label: "⚠ Kończy się", value: summary.endingSoon, color: "bg-orange-50 text-orange-600" },
          { label: "✕ Wygasłe", value: summary.expired, color: "bg-red-100 text-red-600" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-3 py-2 ${s.color}`}>
            <p className="text-[10px] font-medium opacity-70">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + sort ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Szukaj firmy, numeru, email..."
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
          />
          <span className="text-xs text-zinc-400">{filtered.length} / {businesses.length} firm</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { key: "name", label: "Nazwa" },
            { key: "created_at", label: "Data" },
            { key: "subscription_status", label: "Status" },
            { key: "days_remaining", label: "Koniec" },
            { key: "stats.totalCalls", label: "Rozmowy" },
            { key: "stats.totalMinutes", label: "Minuty" },
          ].map(s => (
            <button key={s.key}
              onClick={() => handleSort(s.key as typeof sortBy)}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition ${
                sortBy === s.key
                  ? "bg-[#ccfbf1] text-[#0d9488] font-medium"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s.label} {sortBy === s.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><p className="text-sm text-zinc-400">{search ? "Brak wyników wyszukiwania" : "Brak firm."}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Firma</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Plan</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Okres próbny</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Subskrypcja</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Kontakt</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Numer</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Konsult.</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Założono</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Rozmowy</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Minuty</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">SMS</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Koszt</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const sCfg = statusConfig(b.subscription_status, b.suspended);
                  const trialInfo = periodInfo(b.trial_ends_at, b.subscription_status);
                  const subInfo = periodInfo(b.subscription_current_period_end, b.subscription_status);
                  const trialProgress = periodProgress(b.trial_ends_at, b.created_at);
                  const subProgress = periodProgress(b.subscription_current_period_end, b.created_at);

                  return (
                    <tr key={b.id} onClick={() => onDetail?.(b.id)} className={`border-b border-zinc-50 hover:bg-[#f0fdfa]/50 transition-colors cursor-pointer ${
                      b.subscription_status === "past_due" ? "bg-red-50/30" :
                      b.suspended ? "bg-white" : ""
                    }`}>
                      {/* Firma */}
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-zinc-900">{b.name}</div>
                        {b.industry && <div className="text-xs text-zinc-400">{b.industry}</div>}
                      </td>

                      {/* Plan */}
                      <td className="px-3 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0fdfa] text-[#0d9488]">
                          {getPlanLabel(b.current_plan)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.bg} ${sCfg.text}`}>
                          {sCfg.label}
                        </span>
                      </td>

                      {/* Okres próbny */}
                      <td className="px-3 py-2.5">
                        {b.subscription_status === "trialing" ? (
                          <div className="min-w-[140px]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-medium ${trialInfo.textClass}`}>{trialInfo.label}</span>
                              {b.trial_ends_at && (
                                <span className="text-[10px] text-zinc-400">{fmtDate(b.trial_ends_at)}</span>
                              )}
                            </div>
                            {b.trial_ends_at && b.created_at && (
                              <div className="h-1.5 bg-brand-50 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{
                                  width: `${Math.min(100, trialProgress)}%`,
                                  backgroundColor: trialInfo.color,
                                }} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Subskrypcja */}
                      <td className="px-3 py-2.5">
                        {b.subscription_status === "active" || b.subscription_status === "past_due" ? (
                          <div className="min-w-[140px]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-medium ${subInfo.textClass}`}>
                                {b.subscription_current_period_end ? subInfo.label : "Aktywna"}
                              </span>
                              {b.subscription_current_period_end && (
                                <span className="text-[10px] text-zinc-400">{fmtDate(b.subscription_current_period_end)}</span>
                              )}
                            </div>
                            {b.subscription_current_period_end && b.created_at && (
                              <div className="h-1.5 bg-brand-50 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{
                                  width: `${Math.min(100, subProgress)}%`,
                                  backgroundColor: subInfo.color,
                                }} />
                              </div>
                            )}
                          </div>
                        ) : b.subscription_status === "trialing" ? (
                          <span className="text-xs text-zinc-400">Po teście</span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Kontakt */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {b.phone && <a href={`tel:${b.phone}`} className="text-xs text-[#0d9488] hover:underline font-mono">{b.phone}</a>}
                          {b.twilio_number && <span className="text-xs text-zinc-400 font-mono">{b.twilio_number}</span>}
                          {b.website_url && <a href={b.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[120px]">{b.website_url.replace(/^https?:\/\//, "")}</a>}
                        </div>
                      </td>

                      {/* Numer (WitaLine centrala / portowany) */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {b.ported_phone && (
                            <span className="text-xs font-mono text-purple-600" title={b.port_status === "completed" ? "Portowany" : `Port: ${b.port_status}`}>
                              {b.ported_phone} {b.port_status === "completed" ? "✓" : b.port_status ? "⟳" : ""}
                            </span>
                          )}
                          {!b.ported_phone && (
                            <span className="text-xs text-zinc-300 font-mono">—</span>
                          )}
                        </div>
                      </td>

                      {/* Konsultanci */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold text-zinc-600">{b.consultant_count}</span>
                      </td>

                      {/* Założono */}
                      <td className="px-3 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString("pl-PL") : "—"}
                      </td>

                      {/* Rozmowy */}
                      <td className="px-3 py-2.5 font-semibold text-zinc-900">{b.stats.totalCalls}</td>

                      {/* Minuty */}
                      <td className="px-3 py-2.5">{b.stats.totalMinutes}</td>

                      {/* SMS */}
                      <td className="px-3 py-2.5">{b.stats.smsCount}</td>

                      {/* Koszt */}
                      <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">{b.stats.totalCost} zł</td>

                      {/* Akcje */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); onEdit(b.id); }} className="text-xs px-2 py-1 rounded font-medium text-[#0d9488] bg-brand-50 hover:bg-[#ccfbf1] transition whitespace-nowrap">
                            Edytuj
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDetail?.(b.id); }} className="text-xs px-2 py-1 rounded font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition whitespace-nowrap">
                            Statystyki
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(b.id); }} className="text-xs px-2 py-1 rounded font-medium text-red-500 bg-red-50 hover:bg-red-100 transition whitespace-nowrap">
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Usunąć firmę?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Ta operacja trwale usunie firmę i wszystkie powiązane dane (rozmowy, SMS, opinie). Nie można cofnąć.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition-colors">Anuluj</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50">
                {deleting ? "Usuwanie..." : "Tak, usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
