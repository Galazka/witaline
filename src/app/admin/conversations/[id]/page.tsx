"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Turn {
  role: string;
  message: string;
  time_in_call_secs: number;
  tool_calls?: Record<string, unknown>;
  tool_results?: Record<string, unknown>[];
  interrupted?: boolean;
  llm_usage?: { model_usage?: Record<string, unknown> };
}

interface ConversationDetail {
  conversation_id: string;
  status: string;
  call_successful?: string;
  duration_secs?: number;
  agent_id: string;
  transcript?: Turn[];
  analysis?: {
    transcript_summary?: string;
    call_summary_title?: string;
    call_successful?: string;
    sentiment_analysis?: unknown;
  };
  metadata?: {
    call_duration_secs?: number;
    termination_reason?: string;
    phone_call?: {
      agent_number?: string;
      external_number?: string;
      type?: string;
      stream_sid?: string;
    };
    recording_url?: string;
    charging?: { free_minutes_consumed?: number; tier?: string };
  };
}

export default function ConversationPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/elevenlabs/conversations/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-8 text-red-400">Nie znaleziono rozmowy</div>;

  const meta = data.metadata || {};
  const phone = meta.phone_call || {};
  const analysis = data.analysis || {};
  const turns = data.transcript || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <a href="/admin/conversations" className="text-[#0d9488] hover:text-[#0d9488] text-sm">&larr; Powrót do listy</a>
        <h1 className="text-2xl font-bold text-[#0d9488] mt-2">Szczegóły rozmowy</h1>
        <p className="font-mono text-sm text-gray-500 mt-1">{data.conversation_id}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700">
          <div className="text-xs text-gray-400 uppercase mb-1">Status</div>
          <span className={`px-2 py-0.5 rounded text-sm font-medium ${
            data.status === "done" ? "bg-green-900 text-green-300" :
            data.status === "failed" ? "bg-red-900 text-red-300" :
            "bg-yellow-900 text-yellow-300"
          }`}>{data.status}</span>
        </div>
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700">
          <div className="text-xs text-gray-400 uppercase mb-1">Czas trwania</div>
          <div className="text-lg font-semibold text-white">{meta.call_duration_secs || 0}s</div>
        </div>
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700">
          <div className="text-xs text-gray-400 uppercase mb-1">Telefon</div>
          <div className="text-sm text-white">{phone.external_number || "?"}</div>
          <div className="text-xs text-gray-500">{phone.type || ""}</div>
        </div>
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700">
          <div className="text-xs text-gray-400 uppercase mb-1">Koszt</div>
          <div className="text-lg font-semibold text-white">{meta.charging?.free_minutes_consumed || 0} min</div>
        </div>
      </div>

      {analysis.call_summary_title && (
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700 mb-8">
          <div className="text-xs text-gray-400 uppercase mb-2">Tytuł</div>
          <h2 className="text-lg font-semibold text-white">{analysis.call_summary_title}</h2>
        </div>
      )}

      {analysis.transcript_summary && (
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700 mb-8">
          <div className="text-xs text-gray-400 uppercase mb-2">Podsumowanie</div>
          <p className="text-gray-300 whitespace-pre-wrap">{analysis.transcript_summary}</p>
        </div>
      )}

      {meta.termination_reason && (
        <div className="bg-brand-950 rounded-xl p-4 border border-gray-700 mb-8">
          <div className="text-xs text-gray-400 uppercase mb-2">Zakończenie</div>
          <p className="text-gray-300">{meta.termination_reason}</p>
        </div>
      )}

      <div className="bg-brand-950 rounded-xl p-4 border border-gray-700 mb-8">
        <div className="text-xs text-gray-400 uppercase mb-4">Transkrypcja</div>
        {turns.length === 0 ? (
          <p className="text-gray-500">Brak transkrypcji</p>
        ) : (
          <div className="space-y-4">
            {turns.map((turn, i) => (
              <div key={i} className={`p-3 rounded-lg ${turn.role === "agent" ? "bg-brand-950/50 ml-4" : "bg-brand-900/20 mr-4"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold uppercase ${turn.role === "agent" ? "text-[#0d9488]" : "text-blue-400"}`}>
                    {turn.role === "agent" ? "Maja" : "Klient"}
                  </span>
                  <span className="text-xs text-gray-500">{turn.time_in_call_secs}s</span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{turn.message || <span className="text-gray-500 italic">(narzędzie)</span>}</p>
                {turn.interrupted && <span className="text-xs text-yellow-400 mt-1 block">przerwane</span>}
                {turn.tool_calls && Object.keys(turn.tool_calls).length > 0 && (
                  <div className="mt-1 text-xs text-gray-400">
                    Użyto narzędzia: {Object.values(turn.tool_calls).map((t: any) => t.tool_name).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
