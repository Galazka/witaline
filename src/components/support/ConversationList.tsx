"use client";

import type { Conversation } from "./SupportLayout";

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (c: Conversation) => void;
  loading: boolean;
}

export default function ConversationList({ conversations, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-zinc-700 rounded-xl h-16" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 p-4">
        Brak rozmów
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`w-full text-left px-3 py-3 rounded-xl transition ${
            selectedId === conv.id
              ? "bg-zinc-700 border border-zinc-600"
              : "hover:bg-zinc-700/50 border border-transparent"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate">
              {conv.business?.name || "Nieznana firma"}
            </span>
            <div className="flex gap-1">
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                conv.status === "open" ? "bg-green-500/20 text-green-400" :
                conv.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                "bg-zinc-500/20 text-zinc-400"
              }`}>
                {conv.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {conv.customer_name && (
              <span className="text-xs text-zinc-400">{conv.customer_name}</span>
            )}
            {conv.customer_phone && (
              <span className="text-xs text-zinc-500">{conv.customer_phone}</span>
            )}
            {!conv.customer_name && !conv.customer_phone && (
              <span className="text-xs text-zinc-500">Bez danych klienta</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-zinc-600">
              {new Date(conv.created_at).toLocaleString("pl-PL")}
            </span>
            <span className="text-[10px] text-zinc-600">
              {conv.messages?.[0]?.count || 0} wiad.
            </span>
            {conv.source === "transfer" && (
              <span className="text-[10px] text-purple-400">← transfer</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}