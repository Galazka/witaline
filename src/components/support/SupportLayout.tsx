"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  status: "open" | "pending" | "closed";
  assigned_to: string | null;
  source: string | null;
  created_at: string;
  closed_at: string | null;
  business: { name: string } | null;
  messages: { count: number }[];
}

export interface SupportAgent {
  id: string;
  user_id: string;
  role: "support" | "admin";
}

export default function SupportLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const [agent, setAgent] = useState<SupportAgent | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/support/conversations?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Agent info
  useEffect(() => {
    fetch("/api/support/conversations?status=open")
      .then(r => r.json())
      .then(() => {
        // get agent info from another endpoint
        fetch("/api/auth/user")
          .then(r => r.json())
          .then(d => {
            if (d.email) setUserEmail(d.email);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  return (
    <div ref={ref} className="h-screen flex bg-zinc-900">
      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-zinc-800 border-r border-zinc-700 flex flex-col">
        <div className="p-4 border-b border-zinc-700">
          <h1 className="text-white font-semibold text-sm">Support Panel</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{userEmail}</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-2 bg-zinc-850 border-b border-zinc-700">
          {["open", "pending", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setSelected(null); }}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition ${
                filter === s
                  ? "bg-[#0d9488] text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              {s === "open" ? "Otwarte" : s === "pending" ? "Oczekujące" : "Zamknięte"}
            </button>
          ))}
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selected?.id || null}
          onSelect={setSelected}
          loading={loading}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-zinc-900">
        {selected ? (
          <ChatView
            conversation={selected}
            agent={agent}
            onUpdate={fetchConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Wybierz rozmowę z lewej strony
          </div>
        )}
      </div>
    </div>
  );
}
