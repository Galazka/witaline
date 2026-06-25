"use client";

import { useState, useEffect } from "react";

interface WebhookLog {
  id: string;
  business_id: string;
  event: string;
  url: string;
  status: number;
  response_body: string;
  duration_ms: number;
  success: boolean;
  created_at: string;
}

export default function AdminWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const perPage = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ offset: String(page * perPage), limit: String(perPage) });
    if (filterStatus !== "all") params.set("status", filterStatus);
    fetch("/api/admin/webhook-logs?" + params)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); })
      .catch((e) => console.error("[AdminWebhookLogs] fetch error:", e))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  const pages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-zinc-900">Logi Webhook</h2>

      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">Status:</span>
        {["all", "success", "error"].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s ? "bg-brand-400 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {s === "all" ? "Wszystkie" : s === "success" ? "OK" : "Błędy"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Event</th>
                <th className="text-left px-4 py-3 font-medium">URL</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Czas (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-zinc-400">Ładowanie...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-zinc-400">Brak logów webhook</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString("pl-PL")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-xs font-mono">{log.event}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 max-w-[250px] truncate font-mono text-xs" title={log.url}>{log.url}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {log.status || "ERR"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500 font-mono">{log.duration_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30">
            Poprzednia
          </button>
          <span className="px-3 py-1.5 text-xs text-zinc-500">{page + 1} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30">
            Następna
          </button>
        </div>
      )}
    </div>
  );
}
