"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Conversation as DBConversation } from "@/types/database";

interface ElevenConv {
  conversation_id: string;
  agent_id: string;
  status: string;
  call_successful?: string;
  start_time_unix_secs?: number;
  duration_secs?: number;
  caller_number?: string | null;
  agent_number?: string | null;
}

interface Turn {
  role: string;
  message: string;
  time_in_call_secs: number;
  tool_calls?: Record<string, unknown>;
  interrupted?: boolean;
}

interface ConvDetail {
  conversation_id: string;
  status: string;
  call_successful?: string;
  duration_secs?: number;
  transcript?: Turn[];
  analysis?: { transcript_summary?: string; call_summary_title?: string };
  metadata?: {
    call_duration_secs?: number; termination_reason?: string; recording_url?: string;
    phone_call?: { agent_number?: string; external_number?: string };
    charging?: { free_minutes_consumed?: number };
  };
}

type Channel = "voice" | "web" | "sms" | "widget";

interface MergedConv {
  id: string;
  channel: Channel;
  callerName: string;
  date: string;
  durationSeconds: number;
  summary?: string;
  costPln?: number;
  tokens?: { total: number; input: number; output: number };
  status: string;
  recordingUrl?: string;
  detail?: ConvDetail;
}

export default function AdminConversations() {
  const [merged, setMerged] = useState<MergedConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "duration" | "caller" | "channel" | "status" | "cost">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [statsRange, setStatsRange] = useState<"7" | "30" | "90" | "all">("7");
  const pageSize = 10;

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();

    const [voiceRes, dbRes, callLogsRes] = await Promise.all([
      fetch("/api/elevenlabs/conversations?page_size=50").then(r => r.json()).catch(() => ({ conversations: [] })),
      supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(100).then(r => ({ data: r.data || [] })),
      supabase.from("call_logs").select("id, from_number, duration_seconds, cost_pln, tokens_total, tokens_input, tokens_output, created_at, twilio_call_sid").order("created_at", { ascending: false }).limit(200),
    ]);

    // Build a map from_number -> cost for matching (use the closest by time)
    const callLogsByNumber = new Map<string, { cost_pln: number; tokens_total: number; tokens_input: number; tokens_output: number; duration_seconds: number; created_at: string }[]>();
    for (const cl of (callLogsRes.data || []) as Array<Record<string, unknown>>) {
      const num = (cl.from_number as string) || "";
      if (!num) continue;
      if (!callLogsByNumber.has(num)) callLogsByNumber.set(num, []);
      callLogsByNumber.get(num)!.push({
        cost_pln: Number(cl.cost_pln) || 0,
        tokens_total: Number(cl.tokens_total) || 0,
        tokens_input: Number(cl.tokens_input) || 0,
        tokens_output: Number(cl.tokens_output) || 0,
        duration_seconds: Number(cl.duration_seconds) || 0,
        created_at: (cl.created_at as string) || "",
      });
    }

    function findBestMatch(callerNumber: string | null | undefined, callDate: string): { cost_pln: number; tokens_total: number; tokens_input: number; tokens_output: number } | null {
      if (!callerNumber) return null;
      const candidates = callLogsByNumber.get(callerNumber);
      if (!candidates || candidates.length === 0) return null;
      // Find closest by time
      const callTime = new Date(callDate).getTime();
      let best = candidates[0];
      let bestDiff = Math.abs(new Date(best.created_at).getTime() - callTime);
      for (const c of candidates) {
        const diff = Math.abs(new Date(c.created_at).getTime() - callTime);
        if (diff < bestDiff) { bestDiff = diff; best = c; }
      }
      return bestDiff < 120000 ? { cost_pln: best.cost_pln, tokens_total: best.tokens_total, tokens_input: best.tokens_input, tokens_output: best.tokens_output } : null;
    }

    const voice: MergedConv[] = (voiceRes.conversations || []).map((c: ElevenConv) => {
      const callDate = c.start_time_unix_secs ? new Date(c.start_time_unix_secs * 1000).toISOString() : new Date().toISOString();
      const matched = findBestMatch(c.caller_number, callDate);
      const estCost = c.duration_secs ? Math.round((c.duration_secs / 60) * 0.4 * 100) / 100 : 0;
      const matchedCost = matched?.cost_pln || 0;
      const saneCost = matchedCost > 0 && c.duration_secs && matchedCost < (c.duration_secs / 60) * 5 ? matchedCost : (estCost > 0 ? estCost : 0);
      return {
        id: c.conversation_id,
        channel: (c.caller_number ? "voice" : "widget") as Channel,
        callerName: c.caller_number || "Strona WWW",
        date: callDate,
        durationSeconds: c.duration_secs || 0,
        status: c.status === "done" ? "Zakonczona" : c.status === "failed" ? "Blad" : "Nieznana",
        costPln: saneCost,
        tokens: matched ? { total: matched.tokens_total, input: matched.tokens_input, output: matched.tokens_output } : undefined,
      };
    });

    const db: MergedConv[] = (dbRes.data as DBConversation[] || []).filter(c => c.channel !== "voice").map(c => ({
      id: c.id,
      channel: c.channel as Channel,
      callerName: c.caller_name || c.caller_id || "Anonim",
      date: c.created_at,
      durationSeconds: c.duration_seconds || 0,
      summary: c.summary || undefined,
      status: c.status,
      costPln: 0,
    }));

    const all = [...voice, ...db].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMerged(all);
    setLoading(false);

// Pre-fetch details for voice conversations (to get real costs + summaries)
    for (const v of voice.slice(0, 10)) {
      fetch(`/api/elevenlabs/conversations/${v.id}`)
        .then(r => r.json())
        .then((detail: ConvDetail) => {
          const meta = detail.metadata || {};
          const charging = meta.charging as Record<string, unknown> | undefined;
          const realCost = charging
            ? (Number(charging.llm_charge) || 0) + (Number(charging.call_charge) || 0)
            : 0;
          setMerged(prev => prev.map(m => m.id === v.id ? {
            ...m,
            summary: detail.analysis?.transcript_summary || detail.analysis?.call_summary_title || m.summary,
            durationSeconds: meta.call_duration_secs || m.durationSeconds,
            recordingUrl: meta.recording_url || undefined,
            costPln: realCost > 0 ? realCost : m.costPln,
            detail,
          } : m));
        })
        .catch((e) => console.error("[AdminConversations] error:", e));
    }
  }

  const filtered = merged
    .filter(m => channelFilter === "all" || m.channel === channelFilter)
    .filter(m => !search || m.callerName.toLowerCase().includes(search.toLowerCase()) || m.summary?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date": cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case "duration": cmp = a.durationSeconds - b.durationSeconds; break;
        case "caller": cmp = a.callerName.localeCompare(b.callerName); break;
        case "channel": cmp = a.channel.localeCompare(b.channel); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "cost": cmp = (a.costPln || 0) - (b.costPln || 0); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const statsFiltered = merged.filter(m => {
    if (statsRange === "all") return true;
    const days = Number(statsRange);
    const cutoff = new Date(Date.now() - days * 86400000);
    return new Date(m.date) >= cutoff;
  });

  const stats = {
    total: statsFiltered.length,
    voice: statsFiltered.filter(m => m.channel === "voice").length,
    web: statsFiltered.filter(m => m.channel === "web").length,
    sms: statsFiltered.filter(m => m.channel === "sms").length,
    widget: statsFiltered.filter(m => m.channel === "widget").length,
    totalMinutes: Math.round(statsFiltered.reduce((a, m) => a + m.durationSeconds, 0) / 60),
    totalCost: statsFiltered.reduce((a, m) => a + (m.costPln || 0), 0),
  };

  async function exportCSV() {
    const headers = ["Kanal", "Rozmowca", "Data", "Czas(s)", "Koszt(zl)", "Podsumowanie", "Status"];
    const rows = statsFiltered.map(m => [
      m.channel, m.callerName, new Date(m.date).toISOString(), m.durationSeconds, (m.costPln || 0).toFixed(2),
      (m.summary || "").replace(/"/g, '""'), m.status
    ]);
    const csv = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const csvContent = "\uFEFF" + csv;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    a.download = `witaline-rozmowy-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const channelIcon: Record<string, string> = { voice: "📞", web: "💬", sms: "📱", widget: "🔗" };
  const channelLabel: Record<string, string> = { voice: "Telefon", web: "Czat", sms: "SMS", widget: "Widget" };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">Statystyki</h3>
          <div className="flex items-center gap-2">
            <select value={statsRange} onChange={e => setStatsRange(e.target.value as any)} className="px-2 py-1 text-xs border border-zinc-200 rounded-lg bg-white">
              <option value="7">7 dni</option>
              <option value="30">30 dni</option>
              <option value="90">90 dni</option>
              <option value="all">Wszystko</option>
            </select>
            <button onClick={exportCSV} className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition">Export CSV</button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
          <div><p className="text-lg font-bold text-zinc-900">{stats.total}</p><p className="text-[10px] text-zinc-400">Wszystkie</p></div>
          <div><p className="text-lg font-bold text-zinc-900">{stats.voice}</p><p className="text-[10px] text-zinc-400">📞 Tel.</p></div>
          <div><p className="text-lg font-bold text-zinc-900">{stats.web}</p><p className="text-[10px] text-zinc-400">💬 Czat</p></div>
          <div><p className="text-lg font-bold text-zinc-900">{stats.totalMinutes}</p><p className="text-[10px] text-zinc-400">Minuty</p></div>
          <div><p className="text-lg font-bold text-zinc-900">{stats.totalCost.toFixed(2)}</p><p className="text-[10px] text-zinc-400">Koszt</p></div>
          <div className="flex items-center justify-center">
            <button onClick={fetchAll} className="text-[10px] text-brand-500 hover:underline">Odswiez</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-brand-50 p-1 rounded-lg">
          {(["all", "voice", "web", "sms", "widget"] as const).map(ch => (
            <button key={ch} onClick={() => { setChannelFilter(ch); setPage(0); }}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${channelFilter === ch ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              {ch === "all" ? "Wszystkie" : `${channelIcon[ch] || ""} ${channelLabel[ch] || ch}`}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Szukaj..." className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg w-40" />
        <div className="flex gap-1 ml-auto">
          {(["date", "duration", "caller", "channel", "status", "cost"] as const).map(s => {
            const labels: Record<string, string> = { date: "Data", duration: "Czas", caller: "Rozmówca", channel: "Kanał", status: "Status", cost: "Koszt" };
            return (
              <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortBy(s); setSortDir("desc"); } }}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition ${sortBy === s ? "bg-brand-100 text-brand-600 font-medium" : "text-zinc-500 hover:text-zinc-700"}`}>
                {labels[s]} {sortBy === s ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Ladowanie...</p>
      ) : paginated.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl">Brak rozmow</p>
      ) : (
        <div className="space-y-2">
          {paginated.map(m => {
            const isExpanded = expandedId === m.id;
            const detail = m.detail;
            const meta = detail?.metadata || {};
            const analysis = detail?.analysis || {};
            const recordingUrl = m.recordingUrl || meta.recording_url;
            const turns = detail?.transcript || [];
            const secs = m.durationSeconds || meta.call_duration_secs || 0;

            return (
              <div key={m.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {/* Card header — always visible */}
                <button onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="w-full text-left p-4 hover:bg-brand-50 transition">
                  <div className="flex items-start gap-4">
                    <span className="text-lg shrink-0 mt-0.5">{channelIcon[m.channel] || "📞"}</span>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">Kto</p>
                        <p className="font-medium text-zinc-900 truncate">{m.callerName}</p>
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${m.channel === "voice" ? "bg-blue-50 text-blue-600" : m.channel === "web" ? "bg-green-50 text-green-600" : m.channel === "sms" ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"}`}>
                          {channelLabel[m.channel] || m.channel}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">Data</p>
                        <p className="text-zinc-700">{new Date(m.date).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase">Czas / Koszt</p>
                        <p className="font-mono text-zinc-700">{secs > 0 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "—"}</p>
                        <p className="text-[10px] text-zinc-400">{m.costPln !== undefined ? `${m.costPln.toFixed(2)} zl` : "—"}</p>
                        {m.tokens && <p className="text-[10px] text-purple-500">{m.tokens.total} tok</p>}
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-[10px] text-zinc-400 uppercase">Podsumowanie</p>
                        <p className="text-xs text-zinc-600 leading-relaxed">{analysis?.transcript_summary || m.summary || "—"}</p>
                        {!analysis?.transcript_summary && !m.summary && <p className="text-xs text-zinc-300 italic">Ladowanie...</p>}
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-zinc-400 shrink-0 mt-1 transition ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-white p-4 space-y-4">
                    {recordingUrl && <audio controls src={recordingUrl} className="h-9 max-w-full" />}
                    {analysis?.transcript_summary && (
                      <div className="bg-white rounded-lg p-3 border border-zinc-200">
                        <p className="text-[10px] text-zinc-400 uppercase mb-1">Podsumowanie</p>
                        <p className="text-sm text-zinc-700">{analysis.transcript_summary}</p>
                      </div>
                    )}
                    {meta.termination_reason && <p className="text-xs text-zinc-400">Koniec: {meta.termination_reason}</p>}
                    {meta.charging && <p className="text-xs text-zinc-400">Minuty: {meta.charging.free_minutes_consumed || 0}</p>}
                    {turns.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {turns.map((turn, i) => (
                          <div key={i} className={`flex ${turn.role === "agent" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${turn.role === "agent" ? "bg-white border border-zinc-200 text-zinc-800" : "bg-brand-50 border border-brand-100 text-zinc-800"}`}>
                              <p className="text-[10px] text-zinc-400 mb-1">{turn.role === "agent" ? "Maja" : "Klient"} · {turn.time_in_call_secs}s</p>
                              <p className="whitespace-pre-wrap">{turn.message || "(narzedzie)"}</p>
                              {turn.interrupted && <p className="text-[10px] text-amber-500 mt-1">przerwane</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-zinc-400 text-center italic">Brak transkrypcji</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition">Poprzednia</button>
          <span className="text-zinc-400">Strona {page + 1} z {totalPages} ({filtered.length})</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-700 disabled:opacity-30 transition">Nastepna</button>
        </div>
      )}
    </div>
  );
}