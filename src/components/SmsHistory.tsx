"use client";

import { useEffect, useState } from "react";
import React from "react";

interface SmsLog {
  id: string;
  to_number: string;
  message_body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface Props {
  businessId: string;
}

const statusColors: Record<string, string> = {
  sent: "bg-brand-100 text-brand-500",
  delivered: "bg-brand-100 text-brand-500",
  failed: "bg-red-100 text-red-600",
  pending: "bg-amber-100 text-amber-700",
  queued: "bg-brand-50 text-zinc-500",
};

const statusLabels: Record<string, string> = {
  sent: "Wysłano",
  delivered: "Dostarczono",
  failed: "Błąd",
  pending: "Oczekuje",
  queued: "W kolejce",
};

export default function SmsHistory({ businessId }: Props) {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/business/sms-logs?businessId=${businessId}`)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-center text-zinc-400 py-8 text-sm">Ładowanie SMS-ów...</p>;

  if (logs.length === 0) return (
    <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center">
      <p className="text-sm text-zinc-400">Brak wysłanych SMS-ów</p>
      <p className="text-xs text-zinc-400 mt-1">SMS-y są wysyłane automatycznie po rozmowach klientów z asystentem AI</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Wysłane SMS-y ({logs.length})</p>
      {logs.map(log => (
        <div key={log.id} className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500">{log.to_number}</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] || "bg-brand-50 text-zinc-600"}`}>
              {statusLabels[log.status] || log.status}
            </span>
          </div>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{log.message_body}</p>
          <p className="text-[10px] text-zinc-400">
            {log.sent_at ? new Date(log.sent_at).toLocaleString("pl-PL") : new Date(log.created_at).toLocaleString("pl-PL")}
          </p>
        </div>
      ))}
    </div>
  );
}
