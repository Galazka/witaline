"use client";

import { useState } from "react";

export interface FilterState {
  search: string;
  status: string;
  channel: string;
  tag: string;
  flagged: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: string;
}

interface Props {
  channels?: { key: string; label: string }[];
  tags?: string[];
  onFilter: (f: FilterState) => void;
  onExport?: () => void;
  showExport?: boolean;
  showChannelFilter?: boolean;
}

export default function ConversationFilterBar({ channels, tags, onFilter, onExport, showExport, showChannelFilter }: Props) {
  const [f, setF] = useState<FilterState>({
    search: "", status: "", channel: "", tag: "", flagged: "", dateFrom: "", dateTo: "", sortBy: "created_at", sortDir: "desc",
  });

  function update(key: keyof FilterState, value: string) {
    const next = { ...f, [key]: value };
    setF(next);
    onFilter(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={f.search} onChange={e => update("search", e.target.value)}
            placeholder="Szukaj..."
            className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        </div>

        {/* Status */}
        <select value={f.status} onChange={e => update("status", e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 bg-white">
          <option value="">Status: wszystkie</option>
          <option value="active">Aktywne</option>
          <option value="ended">Zakończone</option>
          <option value="archived">Archiwalne</option>
        </select>

        {/* Channel */}
        {showChannelFilter && channels && (
          <select value={f.channel} onChange={e => update("channel", e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 bg-white">
            <option value="">Kanał: wszystkie</option>
            {channels.map(ch => (
              <option key={ch.key} value={ch.key}>{ch.label}</option>
            ))}
          </select>
        )}

        {/* Flagged */}
        <select value={f.flagged} onChange={e => update("flagged", e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 bg-white">
          <option value="">Oflagowane: wszystkie</option>
          <option value="yes">Tylko oflagowane</option>
          <option value="no">Bez flagi</option>
        </select>

        {/* Sort */}
        <select value={`${f.sortBy}_${f.sortDir}`} onChange={e => {
          const [sortBy, sortDir] = e.target.value.split("_");
          update("sortBy", sortBy);
          update("sortDir", sortDir);
        }}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 bg-white">
          <option value="created_at_desc">Od najnowszych</option>
          <option value="created_at_asc">Od najstarszych</option>
          <option value="caller_name_asc">Klient A-Z</option>
          <option value="caller_name_desc">Klient Z-A</option>
          <option value="status_asc">Status A-Z</option>
        </select>

        {/* Export */}
        {showExport && onExport && (
          <button onClick={onExport}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 hover:bg-brand-50 hover:border-brand-300 transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Eksport CSV
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={f.dateFrom} onChange={e => update("dateFrom", e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
        <span className="text-xs text-zinc-400">—</span>
        <input type="date" value={f.dateTo} onChange={e => update("dateTo", e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30" />

        {tags && tags.length > 0 && (
          <select value={f.tag} onChange={e => update("tag", e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-400/30 bg-white">
            <option value="">Tag: wszystkie</option>
            {tags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
