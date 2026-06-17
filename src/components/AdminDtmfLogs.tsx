"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface DtmfLogRow {
  id: string;
  caller_id: string;
  from_number: string;
  routed_to_extension: string | null;
  routed_business_name: string | null;
  duration_seconds: number | null;
  created_at: string;
  ended_at: string | null;
  classification: string | null;
  status: string | null;
}

export default function AdminDtmfLogs() {
  const [logs, setLogs] = useState<DtmfLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDtmfLogs();
  }, []);

  async function fetchDtmfLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_logs")
      .select("id, caller_id, from_number, routed_to_extension, routed_business_name, duration_seconds, created_at, ended_at, classification, status")
      .eq("routed_from_main", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) console.error("[DtmfLogs] fetch error:", error);
    setLogs((data as DtmfLogRow[]) || []);
    setLoading(false);
  }

  if (loading) return <p className="text-center text-zinc-400 py-12">Ładowanie...</p>;

  if (!logs.length) {
    return (
      <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center">
        <p className="text-sm text-zinc-400">Brak połączeń z przekierowaniem DTMF.</p>
        <p className="text-xs text-zinc-300 mt-2">Gdy ktoś zadzwoni na główny numer i naciśnie # [kod] *, pojawi się tutaj.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Przekierowania DTMF (# [kod] *)</h3>
        <span className="text-xs text-zinc-400">{logs.length} rekordów</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white text-left">
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dzwoniący</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kod DTMF</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Firma</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Czas</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-50 hover:bg-brand-50/50 transition-colors">
                <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{log.caller_id || log.from_number || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 px-2 py-0.5 rounded-md text-xs font-mono font-semibold">
                    # {log.routed_to_extension || "?"} *
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{log.routed_business_name || "—"}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {log.duration_seconds ? `${Math.floor(log.duration_seconds / 60)}:${(log.duration_seconds % 60).toString().padStart(2, "0")}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${log.classification === "order" ? "bg-green-50 text-green-600" : log.classification === "question" ? "bg-blue-50 text-blue-600" : log.classification === "spam" ? "bg-red-50 text-red-500" : "bg-white text-zinc-500"}`}>
                    {log.classification || log.status || "unknown"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
