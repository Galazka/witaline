"use client";

import { useState, useMemo, useCallback } from "react";
import type { CallLog } from "@/types/database";

interface Props {
  logs: CallLog[];
  loading: boolean;
  showBusiness?: boolean;
  isAdmin?: boolean;
  onBulkDelete?: (ids: string[]) => void;
}

const WITALINE_MAIN_ID = "00000000-0000-0000-0000-000000000001";

type SortKey = "classification" | "caller_id" | "created_at" | "duration_seconds" | "cost_pln" | "quality_score";
type SortDir = "asc" | "desc";
type DateFilter = "all" | "today" | "7d" | "30d";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPLN(v: number): string {
  return `${v.toFixed(2)} PLN`;
}

function callerLabel(log: CallLog): string {
  if (!log.twilio_call_sid) return "Strona WWW";
  return log.caller_id || "Nieznany";
}

function getDateFilter(dateFilter: DateFilter): Date | null {
  const now = new Date();
  switch (dateFilter) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d;
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    default:
      return null;
  }
}

export default function CallTable({ logs, loading, showBusiness = true, isAdmin = false, onBulkDelete }: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const minDate = getDateFilter(dateFilter);
    let list = logs;
    if (minDate) {
      list = list.filter((l) => new Date(l.created_at) >= minDate!);
    }
    return list;
  }, [logs, dateFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "classification":
          cmp = (a.classification || "").localeCompare(b.classification || "");
          break;
        case "caller_id":
          cmp = callerLabel(a).localeCompare(callerLabel(b));
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "duration_seconds":
          cmp = a.duration_seconds - b.duration_seconds;
          break;
        case "cost_pln":
          cmp = a.cost_pln - b.cost_pln;
          break;
        case "quality_score":
          cmp = (a.quality_score || 0) - (b.quality_score || 0);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalCalls = sorted.length;
  const totalDuration = sorted.reduce((s, l) => s + l.duration_seconds, 0);
  const totalCost = sorted.reduce((s, l) => s + l.cost_pln, 0);
  const totalTokens = sorted.reduce((s, l) => s + (l.tokens_total || 0), 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortArrow(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: "all", label: "Wszystkie" },
    { key: "today", label: "Dziś" },
    { key: "7d", label: "7 dni" },
    { key: "30d", label: "30 dni" },
  ];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((l) => l.id)));
    }
  }, [sorted, selectedIds]);

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      if (isAdmin) {
        await fetch("/api/admin/call-logs/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "trash" }),
        });
      } else {
        await fetch("/api/business/call-logs/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "trash" }),
        });
      }
      setSelectedIds(new Set());
      onBulkDelete?.(ids);
    } catch { /* ignore */ }
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-zinc-400 text-sm">
        Ładowanie połączeń...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Połączenia</p>
          <p className="text-lg font-bold text-zinc-900">{totalCalls}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Czas</p>
          <p className="text-lg font-bold text-zinc-900">{Math.floor(totalDuration / 60)} min</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Koszt</p>
          <p className="text-lg font-bold text-red-500">{fmtPLN(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Tokeny</p>
          <p className="text-lg font-bold text-purple-600">{totalTokens.toLocaleString("pl-PL")}</p>
        </div>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {dateFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                dateFilter === f.key
                  ? "bg-brand-400 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Sortuj:</span>
          {(["classification", "caller_id", "created_at", "duration_seconds", "cost_pln", "quality_score"] as SortKey[]).map((key) => {
            const labels: Record<SortKey, string> = {
              classification: "Flaga",
              caller_id: "Numer",
              created_at: "Data",
              duration_seconds: "Czas",
              cost_pln: "Koszt",
              quality_score: "Ocena",
            };
            return (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`px-2 py-1 rounded ${
                  sortKey === key
                    ? "bg-brand-50 text-brand-600 font-semibold"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {labels[key]}{sortArrow(key)}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-4 py-2">
          <span className="text-sm text-brand-700 font-medium">
            Wybrano {selectedIds.size} z {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white rounded-lg hover:bg-zinc-50 border border-zinc-200 transition"
            >
              Odznacz
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
            >
              {deleting ? "Usuwanie..." : `Usuń ${selectedIds.size}`}
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">Brak połączeń.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className={`bg-white/55 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden ${selectedIds.has(log.id) ? "ring-2 ring-brand-400" : ""}`}
              >
                <div className="w-full flex items-center gap-2 px-4 py-3 hover:bg-brand-50/50 transition">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(log.id)}
                    onChange={() => toggleSelect(log.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-zinc-300 text-brand-400 focus:ring-brand-200 shrink-0"
                  />
                  <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      log.classification === "order"
                        ? "bg-emerald-500"
                        : log.classification === "offer"
                        ? "bg-blue-500"
                        : log.classification === "question"
                        ? "bg-amber-500"
                        : log.classification === "booking"
                        ? "bg-violet-500"
                        : log.classification === "spam"
                        ? "bg-red-500"
                        : "bg-brand-200"
                    }`}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {callerLabel(log)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(log.created_at)} &middot;{" "}
                      {formatDuration(log.duration_seconds)}
                    </p>
                    {log.business_name && showBusiness && (
                      <p className="text-xs flex items-center gap-1 mt-0.5">
                        {log.business_id === WITALINE_MAIN_ID ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-brand-100 text-brand-700 font-medium">
                            WitaLine
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 font-medium">
                            {log.business_name}
                          </span>
                        )}
                      </p>
                    )}
                    {!log.twilio_call_sid && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium mt-0.5">
                        Widget
                      </span>
                    )}
                    {log.routed_from_main && log.routed_business_name && (
                      <p className="text-xs text-zinc-400">via 🔀 {log.routed_business_name}</p>
                    )}
                    {log.routed_from_main && !log.routed_business_name && (
                      <span className="text-xs text-zinc-400">via 🔀</span>
                    )}
                    {log.has_human_handoff && (
                      <span className={`inline-flex mt-1 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        log.handoff_status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        🔀 {log.handoff_status === "completed" ? "Odebrano" : "Przekazano"}
                        {log.handoff_target_number && <span className="opacity-70">· {log.handoff_target_number}</span>}
                        {log.handoff_duration_seconds > 0 && <span>· {Math.floor(log.handoff_duration_seconds / 60)}:{(log.handoff_duration_seconds % 60).toString().padStart(2, "0")}</span>}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="font-medium text-zinc-700">
                      {log.cost_pln.toFixed(2)} PLN
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        log.classification === "order"
                          ? "text-emerald-600"
                          : log.classification === "offer"
                          ? "text-blue-600"
                          : log.classification === "question"
                          ? "text-amber-600"
                          : log.classification === "booking"
                          ? "text-violet-600"
                          : log.classification === "spam"
                          ? "text-red-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {log.classification === "order"
                        ? "Zamówienie"
                        : log.classification === "offer"
                        ? "Oferta"
                        : log.classification === "question"
                        ? "Pytanie"
                        : log.classification === "booking"
                        ? "Rezerwacja"
                        : log.classification === "spam"
                        ? "Spam"
                        : "Inne"}
                    </span>
                    {log.quality_score != null && (
                      <span
                        title={log.quick_summary || `Ocena: ${log.quality_score}/10`}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0 ${
                          log.quality_score >= 8
                            ? "bg-green-100 text-green-700"
                            : log.quality_score >= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.quality_score}
                      </span>
                    )}
                  </div>
                  {log.recording_url && (
                    <span title="Nagranie dostępne" className="text-brand-600 text-sm shrink-0">
                      ▶
                    </span>
                  )}
                  {log.was_helpful !== null && (
                    <span className="text-lg shrink-0">
                      {log.was_helpful ? "✓" : "—"}
                    </span>
                  )}
                </button>
                  </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-100 space-y-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 bg-white/55 rounded-lg px-3 py-1.5">
                        <span className="text-zinc-400">💰</span>
                        <span className="font-medium text-zinc-700">{log.cost_pln.toFixed(2)} PLN</span>
                        <span className="text-zinc-300">|</span>
                        <span className="text-zinc-400">{log.duration_seconds}s</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-50 rounded-lg px-3 py-1.5">
                        <span className="text-zinc-400">🪙</span>
                        <span className="font-medium text-purple-600">
                          {log.tokens_total || Math.ceil((log.duration_seconds / 60) * 1000)} tok
                        </span>
                        {(log.tokens_input || log.tokens_output) && (
                          <span className="text-zinc-400">
                            (in: {log.tokens_input || 0} / out: {log.tokens_output || 0})
                          </span>
                        )}
                      </div>
                    </div>

                    {log.recording_url && (
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Nagranie</p>
                        <audio controls src={log.recording_url} className="w-full h-9" preload="none">
                          Twoja przeglądarka nie wspiera odtwarzacza audio.
                        </audio>
                      </div>
                    )}
                    {log.transcript && (
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Transkrypcja</p>
                        <p className="text-sm text-zinc-700 bg-white/55 rounded-lg p-3">{log.transcript}</p>
                      </div>
                    )}
                    {log.quick_summary && (
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Jakość rozmowy</p>
                        <p className="text-sm text-zinc-700 bg-green-50 rounded-lg p-3">
                          {log.quality_score != null && (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold mr-2 ${
                              log.quality_score >= 8
                                ? "bg-green-200 text-green-800"
                                : log.quality_score >= 5
                                ? "bg-amber-200 text-amber-800"
                                : "bg-red-200 text-red-800"
                            }`}>
                              {log.quality_score}
                            </span>
                          )}
                          {log.quick_summary}
                        </p>
                      </div>
                    )}
                    {log.ai_summary && (
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Podsumowanie AI</p>
                        <p className="text-sm text-zinc-700 bg-brand-50 rounded-lg p-3">{log.ai_summary}</p>
                      </div>
                    )}

                    {log.has_human_handoff && (
                      <div className="rounded-xl border border-brand-100 bg-white/45 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">Segment konsultanta</p>
                            <p className="text-xs text-zinc-500">
                              Przekazano na {log.handoff_target_number || "numer firmy"}{log.handoff_duration_seconds ? ` · ${Math.floor(log.handoff_duration_seconds / 60)}:${(log.handoff_duration_seconds % 60).toString().padStart(2, "0")} min` : ""}
                              {log.handoff_status === "completed" && <span className="ml-1 text-green-600">· Odebrano</span>}
                              {log.handoff_status === "no-answer" && <span className="ml-1 text-red-500">· Nie odebrano</span>}
                              {log.handoff_status === "failed" && <span className="ml-1 text-red-500">· Błąd</span>}
                            </p>
                          </div>
                        </div>
                        {log.post_handoff_summary && (
                          <div>
                            <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Podsumowanie konsultanta</p>
                            <p className="text-sm text-zinc-700 bg-white/60 rounded-lg p-3">{log.post_handoff_summary}</p>
                          </div>
                        )}
                        {log.handoff_recording_url && (
                          <div>
                            <p className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Nagranie konsultanta</p>
                            <audio controls src={log.handoff_recording_url} className="w-full h-9" preload="none" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
