"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface Conversation {
  id: string;
  caller_name: string | null;
  caller_id: string | null;
  status: string;
  channel: string;
  summary: string | null;
  tags: string[] | null;
  sentiment: string | null;
  message_count: number | null;
  created_at: string;
  updated_at?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "human" | "system";
  content: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}g`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" });
}

export default function BusinessLiveChat({ businessId }: { businessId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel("business-chats")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `business_id=eq.${businessId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            if (selected && newMsg.role !== "human") return [...prev, newMsg];
            return prev;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  useEffect(() => {
    if (selected) fetchMessages(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .in("channel", ["widget", "web"])
      .order("status", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(50);
    const convs = ((data as Conversation[]) || []).sort((a, b) => {
      const aWaiting = (a.tags || []).includes("oczekuje_na_konsultanta");
      const bWaiting = (b.tags || []).includes("oczekuje_na_konsultanta");
      if (aWaiting && !bWaiting) return -1;
      if (!aWaiting && bWaiting) return 1;
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setConversations(convs);
    setLoading(false);
  }

  async function fetchMessages(convId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  }

  async function handleSend() {
    if (!selected || !inputRef.current) return;
    const content = inputRef.current.value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/business/chats/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        inputRef.current.value = "";
        await fetchMessages(selected.id);
        fetchConversations();
      }
    } catch (e) {
      console.error("[BusinessLiveChat] send error:", e);
    }
    setSending(false);
  }

  async function handleClose() {
    if (!selected) return;
    await fetch(`/api/business/chats/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    });
    setSelected((prev) => prev ? { ...prev, status: "ended" } : null);
    fetchConversations();
  }

  async function handleReopen() {
    if (!selected) return;
    await fetch(`/api/business/chats/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setSelected((prev) => prev ? { ...prev, status: "active" } : null);
    fetchConversations();
  }

  const activeCount = conversations.filter((c) => c.status === "active").length;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="font-semibold text-zinc-900">
          Czat na żywo
          {activeCount > 0 && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {activeCount} aktywnych
            </span>
          )}
        </h3>
      </div>

      <div className="flex h-[600px]">
        {/* Left panel: conversation list */}
        <div className="w-72 border-r border-zinc-100 overflow-y-auto shrink-0">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-400">Ładowanie...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-400">Brak rozmów</div>
          ) : (
            conversations.map((conv) => {
              const waiting = (conv.tags || []).includes("oczekuje_na_konsultanta");
              return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-50 transition ${
                  selected?.id === conv.id ? "bg-brand-50" : waiting ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {waiting && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-pulse" title="Prosi o konsultanta" />
                  )}
                  {!waiting && conv.status === "active" && (
                    <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                  )}
                  {!waiting && conv.status === "ended" && (
                    <span className="w-2 h-2 bg-zinc-300 rounded-full shrink-0" />
                  )}
                  <span className={`text-sm font-medium truncate ${waiting ? "text-amber-900" : "text-zinc-900"}`}>
                    {conv.caller_name || conv.caller_id || "Anonim"}
                  </span>
                  {waiting && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                      Transfer
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-zinc-400 shrink-0">
                    {timeAgo(conv.created_at)}
                  </span>
                </div>
                {waiting ? (
                  <p className="text-xs text-amber-600 truncate pl-4 font-medium">Klient prosi o konsultanta</p>
                ) : conv.summary ? (
                  <p className="text-xs text-zinc-500 truncate pl-4">{conv.summary}</p>
                ) : conv.status === "active" ? (
                  <p className="text-xs text-green-600 truncate pl-4">Oczekuje na odpowiedź</p>
                ) : null}
              </button>
              );
            })
          )}
        </div>

        {/* Right panel: chat window */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
              Wybierz rozmowę z listy
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {selected.caller_name || selected.caller_id || "Anonimowy klient"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {selected.channel === "widget" ? "🔗 Widget" : "💬 Web"} · rozmowa z{" "}
                    {new Date(selected.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status === "ended" ? (
                    <button onClick={handleReopen}
                      className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition font-medium">
                      Otwórz
                    </button>
                  ) : (
                    <button onClick={handleClose}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium">
                      Zakończ
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" :
                      msg.role === "human" ? "justify-end" :
                      "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-brand-400 text-white rounded-br-md"
                          : msg.role === "human"
                          ? "bg-brand-200 text-zinc-800 rounded-br-md"
                          : "bg-brand-50 text-zinc-800 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "human" && (
                        <div className="text-[10px] font-semibold text-brand-700 mb-0.5">Konsultant</div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-[10px] mt-1 ${
                        msg.role === "user" ? "text-white/60" : "text-zinc-400"
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selected.status !== "ended" && (
                <div className="border-t border-zinc-100 p-3 bg-white">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Napisz odpowiedź..."
                      rows={1}
                      className="flex-1 bg-zinc-50 text-zinc-900 text-sm rounded-xl px-3 py-2.5 placeholder-zinc-400 border border-zinc-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none resize-none"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="shrink-0 bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
                    >
                      {sending ? "..." : "Wyślij"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
