"use client";

import type { CallLog } from "@/types/database";

interface Props {
  callLogs: CallLog[];
  onClick: () => void;
}

export default function RecentCallsPreview({ callLogs, onClick }: Props) {
  const totalSeconds = callLogs.reduce((acc, l) => acc + l.duration_seconds, 0);
  const totalCost = callLogs.reduce((acc, l) => acc + l.cost_pln, 0);
  const ordersCount = callLogs.filter((l) => l.classification === "order").length;
  const helpfulCount = callLogs.filter((l) => l.was_helpful === true).length;
  const avgDuration = callLogs.length > 0 ? Math.round(totalSeconds / callLogs.length) : 0;

  const recentCalls = callLogs.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Statystyki głosowe</p>
        <button onClick={onClick} className="text-xs text-[#0d9488] hover:text-[#0f766e] transition">Zobacz wszystkie →</button>
      </div>

      {/* Mini stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-white/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Wszystkie</p>
          <p className="text-lg font-bold text-zinc-900">{callLogs.length}</p>
        </div>
        <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-white/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Zamówienia</p>
          <p className="text-lg font-bold text-[#0d9488]">{ordersCount}</p>
        </div>
        <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-white/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Śr. czas</p>
          <p className="text-lg font-bold text-zinc-900">{avgDuration}s</p>
        </div>
        <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-white/20 p-3">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Koszt</p>
          <p className="text-lg font-bold text-zinc-900">{totalCost.toFixed(2)} zł</p>
        </div>
      </div>

      {/* Classification bar */}
      {callLogs.length > 0 && (
        <div className="bg-white/55 backdrop-blur-xl rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500">Skuteczność:</span>
            <span className="text-green-600 font-medium">{helpfulCount} pozytywnych</span>
            <div className="flex-1 h-2 bg-brand-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0d9488] rounded-full" style={{ width: `${(ordersCount / Math.max(callLogs.length, 1)) * 100}%` }} />
            </div>
            <span className="text-zinc-500">{Math.round((ordersCount / Math.max(callLogs.length, 1)) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Recent calls list */}
      <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-white/20 divide-y divide-zinc-100">
        {recentCalls.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-400">Brak połączeń</div>
        ) : (
          recentCalls.map(call => (
            <div key={call.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0fdfa] transition cursor-pointer" onClick={onClick}>
              <span className="text-sm">{call.classification === "order" ? "🛒" : "❓"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900">{call.caller_id || "Anonim"}</p>
                <p className="text-xs text-zinc-400">{Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, "0")} min · {call.cost_pln.toFixed(2)} zł</p>
              </div>
              {call.was_helpful && <span className="text-xs text-green-500 shrink-0">✅ Pomocne</span>}
              {call.has_human_handoff && <span className="text-[10px] text-brand-700 bg-brand-100 rounded-full px-2 py-0.5 font-medium shrink-0">🔀 Konsultant</span>}
              <span className="text-[10px] text-zinc-400 shrink-0">{new Date(call.created_at).toLocaleDateString("pl-PL")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
