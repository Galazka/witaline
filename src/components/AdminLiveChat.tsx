"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface AdminConversation {
  id: string;
  business_id: string;
  caller_name: string | null;
  caller_id: string | null;
  channel: string;
  status: string;
  summary: string | null;
  tags: string[] | null;
  flagged: boolean | null;
  flag_color: string | null;
  created_at: string;
  businesses: { name: string; phone: string | null } | { name: string; phone: string | null }[];
}

interface AdminMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  active: "Aktywny",
  ended: "Zakończony",
  archived: "Zarchiwizowany",
};

const channelLabels: Record<string, string> = {
  widget: "Widget",
  web: "Strona",
  sms: "SMS",
  voice: "Telefon",
};

export default function AdminLiveChat() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: statusFilter, limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/live-chat?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [statusFilter, searchQuery]);

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/live-chat/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ }
    setLoadingMessages(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for new messages across all businesses
  useEffect(() => {
    const channel = supabase
      .channel("admin-live-chat")
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          const msg = payload.new as AdminMessage;
          if (msg.conversation_id === selectedId) {
            setMessages((prev) => [...prev, msg]);
          }
          fetchConversations();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, supabase, fetchConversations]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/live-chat/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyText("");
        fetchConversations();
      }
    } catch { /* silent */ }
    setSending(false);
  };

  const selected = conversations.find((c) => c.id === selectedId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-400";
      default: return "bg-zinc-300";
    }
  };

  const getBusinessName = (conv: AdminConversation) => {
    const biz = Array.isArray(conv.businesses) ? conv.businesses[0] : conv.businesses;
    return biz?.name || "Nieznana firma";
  };

  const hasTransferTag = (conv: AdminConversation) =>
    conv.tags?.includes("oczekuje_na_konsultanta");

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Left panel */}
      <div className="w-72 lg:w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex gap-1">
            {["active", "waiting", "all"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setLoading(true); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-brand-400 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {s === "active" ? "Aktywne" : s === "waiting" ? "Oczekujące" : "Wszystkie"}
              </button>
            ))}
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchConversations()}
            placeholder="Szukaj rozmowy..."
            className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-zinc-400">Brak rozmów</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-3 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    selectedId === conv.id ? "bg-brand-50 dark:bg-brand-900/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getStatusColor(conv.status)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {conv.caller_name || conv.caller_id || "Nieznany"}
                        </p>
                        {hasTransferTag(conv) && (
                          <span className="text-[9px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1 py-0.5 rounded shrink-0">
                            Transfer
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {getBusinessName(conv)} &middot; {channelLabels[conv.channel] || conv.channel}
                      </p>
                      {conv.summary && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 leading-relaxed">
                          {conv.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">Wybierz rozmowę z listy</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selected.status)}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {selected.caller_name || selected.caller_id || "Nieznany"}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {getBusinessName(selected)} &middot; {channelLabels[selected.channel] || selected.channel}
                  &middot; {statusLabels[selected.status] || selected.status}
                  {hasTransferTag(selected) && " · Oczekuje na konsultanta"}
                </p>
              </div>
              {selected.caller_id && (
                <a
                  href={`tel:${selected.caller_id}`}
                  className="text-xs text-brand-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
                >
                  {selected.caller_id}
                </a>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Brak wiadomości</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
                        msg.role === "user"
                          ? "bg-brand-400 text-white rounded-br-md"
                          : msg.role === "human"
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-bl-md"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md"
                      }`}
                    >
                      <p className="text-[10px] opacity-60 mb-1">
                        {msg.role === "user" ? "Klient" : msg.role === "human" ? "Admin" : "Asystent AI"}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 shrink-0">
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Odpowiedz jako admin..."
                  className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-400/30 transition-colors"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="w-10 h-10 bg-brand-400 text-white rounded-xl flex items-center justify-center hover:bg-brand-500 transition disabled:opacity-30 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
