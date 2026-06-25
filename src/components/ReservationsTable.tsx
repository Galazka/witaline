"use client";

import { useState, useMemo } from "react";
import type { Reservation } from "@/types/database";

interface Props {
  reservations: Reservation[];
  loading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-brand-100 text-brand-500",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-brand-50 text-zinc-600",
};

const statusLabels: Record<string, string> = {
  pending: "Oczekuje",
  confirmed: "Potwierdzona",
  cancelled: "Anulowana",
  completed: "Zrealizowana",
};

const sourceLabels: Record<string, string> = {
  ai_agent: "AI",
  staff: "Ręczna",
  admin: "Admin",
  client: "Klient",
};

const sourceStyles: Record<string, string> = {
  ai_agent: "bg-blue-50 text-blue-600",
  staff: "bg-green-50 text-green-600",
  admin: "bg-purple-50 text-purple-600",
  client: "bg-orange-50 text-orange-600",
};

export default function ReservationsTable({
  reservations,
  loading,
  onStatusChange,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = reservations;
    if (q) {
      list = list.filter(r =>
        (r.caller_name || "").toLowerCase().includes(q) ||
        (r.caller_phone || "").includes(q) ||
        (r.service_type || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const diff = new Date(a.reserved_at).getTime() - new Date(b.reserved_at).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [reservations, search, sortDir]);

  if (loading) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj rezerwacji..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
        >
          {sortDir === "desc" ? "↓" : "↑"} Data
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center m-4">
          <p className="text-sm text-zinc-400">{search ? "Brak wyników wyszukiwania" : "Brak rezerwacji"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white text-left">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Klient</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Usługa</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Termin</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Źródło</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notatki</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const date = new Date(r.reserved_at);
                const srcType = r.created_by_type || "";
                return (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{r.caller_name || "—"}</p>
                      <p className="text-xs text-zinc-400">{r.caller_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{r.service_type}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p>{date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-zinc-400">
                        {date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} ({r.duration_minutes} min)
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sourceStyles[srcType] || "bg-zinc-50 text-zinc-500"}`}>
                        {sourceLabels[srcType] || srcType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => onStatusChange(r.id, e.target.value)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${statusStyles[r.status] || "bg-brand-50 text-zinc-600"}`}
                      >
                        <option value="pending">Oczekuje</option>
                        <option value="confirmed">Potwierdzona</option>
                        <option value="completed">Zrealizowana</option>
                        <option value="cancelled">Anulowana</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-[160px] truncate">{r.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDelete(r.id)} className="text-red-400 hover:text-red-600 transition text-xs font-medium">
                        Usuń
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
