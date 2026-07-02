"use client";

import { useEffect, useState } from "react";

interface Conversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  call_successful?: string;
  start_time_unix_secs?: number;
  duration_secs?: number;
  caller_number?: string | null;
  agent_number?: string | null;
}

export default function AdminConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/elevenlabs/conversations?page_size=50")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      done: "bg-green-900 text-green-300",
      failed: "bg-red-900 text-red-300",
      unknown: "bg-yellow-900 text-yellow-300",
    };
    return m[status] || "bg-brand-950 text-gray-300";
  };

  const statusLabel = (status: string) => {
    const m: Record<string, string> = {
      done: "zakończona",
      failed: "błąd",
      unknown: "nieznany",
    };
    return m[status] || status;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0d9488] mb-6">Historia rozmów telefonicznych</h1>
      <div className="space-y-3">
        {conversations.map((c) => (
          <a
            key={c.conversation_id}
            href={`/admin/conversations/${c.conversation_id}`}
            className="block bg-brand-950 rounded-xl p-4 hover:bg-brand-950 transition border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-gray-400">{c.conversation_id.slice(0, 20)}...</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                  {c.call_successful === "success" && (
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">udana</span>
                  )}
                  {c.call_successful === "failed" && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-900 text-red-300">nieudana</span>
                  )}
                  {c.caller_number && (
                    <span className="text-xs text-gray-500">📞 {c.caller_number}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {c.start_time_unix_secs && (
                    <span>{new Date(c.start_time_unix_secs * 1000).toLocaleString("pl-PL", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}</span>
                  )}
                  {c.duration_secs && (
                    <span>{Math.floor(c.duration_secs / 60)}:{String(c.duration_secs % 60).padStart(2, "0")} min</span>
                  )}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-500 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
        {conversations.length === 0 && (
          <p className="text-gray-500 text-center py-8">Brak rozmów</p>
        )}
      </div>
    </div>
  );
}
