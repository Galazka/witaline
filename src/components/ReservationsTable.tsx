"use client";

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

export default function ReservationsTable({
  reservations,
  loading,
  onStatusChange,
  onDelete,
}: Props) {
  if (loading) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  if (reservations.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
        <p className="text-sm text-zinc-400">Brak rezerwacji</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white text-left">
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Klient</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Usługa</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Termin</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notatki</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => {
              const date = new Date(r.reserved_at);
              return (
                <tr key={r.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{r.caller_name || "—"}</p>
                    <p className="text-xs text-zinc-400">{r.caller_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{r.service_type}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    <p>{date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</p>
                    <p className="text-xs text-zinc-400">
                      {date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })} ({r.duration_minutes} min)
                    </p>
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
    </div>
  );
}




