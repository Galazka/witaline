"use client";

import { useEffect, useState } from "react";

interface SmsLog {
  id: string;
  business_id: string | null;
  to_number: string;
  message_body: string;
  status: string;
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  businesses?: { name: string } | null;
}

export default function AdminSmsLogs() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sms-logs?view=${filter}&limit=200`);
      if (!res.ok) { setError("Błąd ładowania logów SMS"); setLoading(false); return; }
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch { setError("Błąd sieci"); }
    setLoading(false);
  }

  const statusColors: Record<string, string> = {
    sent: "bg-brand-100 text-[#0d9488]",
    delivered: "bg-brand-100 text-[#0d9488]",
    failed: "bg-red-100 text-red-600",
    pending: "bg-amber-100 text-amber-700",
    queued: "bg-brand-50 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Logi SMS ({total})</h2>
        <div className="flex gap-1 bg-brand-50 p-0.5 rounded-lg">
          {(["all", "sent", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filter === f ? "bg-white dark:bg-brand-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"}`}>
              {f === "all" ? "Wszystkie" : f === "sent" ? "Wysłane" : "Błędy"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-center text-zinc-400 dark:text-zinc-500 py-8">Ładowanie...</p>
      ) : logs.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-brand-700 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Brak SMS-ów</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white dark:bg-brand-900 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Firma</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Numer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Treść</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Wysłano</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase">Błąd</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 dark:border-brand-800 last:border-b-0 hover:bg-[#f0fdfa]">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{log.businesses?.name || "WitaLine"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{log.to_number}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-zinc-600 dark:text-zinc-400">{log.message_body}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] || "bg-brand-50 text-zinc-600 dark:text-zinc-400"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString("pl-PL") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">
                      {log.error_message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
