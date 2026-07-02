"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import ConversationFilterBar, { type FilterState } from "./ConversationFilterBar";
import ConversationContextMenu from "./ConversationContextMenu";

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
  flagged?: boolean;
  flag_color?: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "human" | "system";
  content: string;
  created_at: string;
  conversation_id?: string;
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
  const [filters, setFilters] = useState<FilterState>({
    search: "", status: "", channel: "", tag: "", flagged: "", dateFrom: "", dateTo: "", sortBy: "created_at", sortDir: "desc",
  });
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
            if (selected && newMsg.conversation_id === selected.id) return [...prev, newMsg];
            return prev;
          });
          fetchConversations();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, selected?.id]);

  useEffect(() => { fetchConversations(); }, [businessId, filters]);

  useEffect(() => {
    if (selected) fetchMessages(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    setLoading(true);
    let query = supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .in("channel", ["widget", "web"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.channel) query = query.eq("channel", filters.channel);
    if (filters.flagged === "yes") query = query.eq("flagged", true);
    if (filters.flagged === "no") query = query.or("flagged.is.null,flagged.eq.false");
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
    if (filters.tag) query = query.contains("tags", [filters.tag]);

    const { data } = await query;
    const convs = ((data as Conversation[]) || []).filter(c => {
      if (!filters.search) return true;
      const s = filters.search.toLowerCase();
      return (c.caller_name || "").toLowerCase().includes(s) ||
             (c.caller_id || "").toLowerCase().includes(s) ||
             (c.summary || "").toLowerCase().includes(s) ||
             (c.tags || []).some(t => t.toLowerCase().includes(s));
    });

    convs.sort((a, b) => {
      const aWaiting = (a.tags || []).includes("oczekuje_na_konsultanta");
      const bWaiting = (b.tags || []).includes("oczekuje_na_konsultanta");
      if (aWaiting && !bWaiting) return -1;
      if (!aWaiting && bWaiting) return 1;
      if (a.flagged && !b.flagged) return -1;
      if (!a.flagged && b.flagged) return 1;
      const dir = filters.sortDir === "asc" ? 1 : -1;
      if (filters.sortBy === "caller_name") {
        return ((a.caller_name || a.caller_id || "") > (b.caller_name || b.caller_id || "") ? 1 : -1) * dir;
      }
      if (filters.sortBy === "status") {
        return (a.status > b.status ? 1 : -1) * dir;
      }
      return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * (filters.sortDir === "asc" ? -1 : 1);
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        inputRef.current.value = "";
        await fetchMessages(selected.id);
        fetchConversations();
      }
    } catch (e) { console.error("[BusinessLiveChat] send error:", e); }
    setSending(false);
  }

  async function handleClose() {
    if (!selected) return;
    await fetch(`/api/business/chats/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ended" }) });
    setSelected((prev) => prev ? { ...prev, status: "ended" } : null);
    fetchConversations();
  }

  async function handleReopen() {
    if (!selected) return;
    await fetch(`/api/business/chats/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
    setSelected((prev) => prev ? { ...prev, status: "active" } : null);
    fetchConversations();
  }

  async function deleteMessage(msgId: string) {
    if (!confirm("Usunąć tę wiadomość?")) return;
    try {
      await fetch(`/api/business/chats/${selected!.id}/messages/${msgId}`, { method: "DELETE" });
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (e) { console.error("[BusinessLiveChat] delete error:", e); }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/business/conversations/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          channels: filters.channel ? [filters.channel] : undefined,
          status: filters.status || undefined,
          flagged: filters.flagged === "yes" ? true : filters.flagged === "no" ? false : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          tag: filters.tag || undefined,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `rozmowy-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error("[BusinessLiveChat] export error:", e); }
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [conversations]);

  const activeCount = conversations.filter((c) => c.status === "active").length;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900">
            Czat na żywo
            {activeCount > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{activeCount} aktywnych</span>
            )}
          </h3>
          <button onClick={fetchConversations} className="text-xs text-zinc-400 hover:text-zinc-600 transition">Odśwież</button>
        </div>
        <ConversationFilterBar channels={[{ key: "widget", label: "Widget" }, { key: "web", label: "Web" }]} tags={allTags}
          onFilter={(f) => { setFilters(f); }} onExport={handleExport} showExport showChannelFilter />
      </div>

      <div className="flex h-[600px]">
        <div className="w-72 border-r border-zinc-100 overflow-y-auto shrink-0">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-400">Ładowanie...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-400">Brak rozmów</div>
          ) : (
            conversations.map((conv) => {
              const waiting = (conv.tags || []).includes("oczekuje_na_konsultanta");
              return (
                <ConversationContextMenu key={conv.id} conversationId={conv.id}
                  isFlagged={!!conv.flagged} flagColor={conv.flag_color || null} onUpdate={fetchConversations}>
                  <button onClick={() => setSelected(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-50 transition ${
                      selected?.id === conv.id ? "bg-brand-50" : waiting ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-zinc-50"
                    }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {conv.flag_color && (
                        <span className="w-2 h-4 rounded-sm shrink-0" style={{ backgroundColor: ({
                          red: "#ef4444", orange: "#f97316", amber: "#f59e0b", green: "#22c55e", blue: "#3b82f6", purple: "#a855f7", pink: "#ec4899",
                        })[conv.flag_color] || "#f59e0b" }} title={`Flaga: ${conv.flag_color}`} />
                      )}
                      {waiting && <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-pulse" />}
                      {!waiting && conv.status === "active" && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />}
                      {!waiting && conv.status === "ended" && <span className="w-2 h-2 bg-zinc-300 rounded-full shrink-0" />}
                      <span className={`text-sm font-medium truncate ${waiting ? "text-amber-900" : "text-zinc-900"}`}>
                        {conv.caller_name || conv.caller_id || "Anonim"}
                      </span>
                      {waiting && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">Transfer</span>}
                      {conv.flagged && <span className="text-xs shrink-0">🚩</span>}
                      <span className="ml-auto text-[10px] text-zinc-400 shrink-0">{timeAgo(conv.created_at)}</span>
                    </div>
                    {waiting ? (
                      <p className="text-xs text-amber-600 truncate pl-4 font-medium">Klient prosi o konsultanta</p>
                    ) : conv.summary ? (
                      <p className="text-xs text-zinc-500 truncate pl-4">{conv.summary}</p>
                    ) : conv.status === "active" ? (
                      <p className="text-xs text-green-600 truncate pl-4">Oczekuje na odpowiedź</p>
                    ) : null}
                  </button>
                </ConversationContextMenu>
              );
            })
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">Wybierz rozmowę z listy</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {selected.caller_name || selected.caller_id || "Anonimowy klient"}
                    {selected.flagged && <span className="ml-1.5" title="Oflagowane">🚩</span>}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {selected.channel === "widget" ? "🔗 Widget" : "💬 Web"} · {new Date(selected.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status === "ended" ? (
                    <button onClick={handleReopen}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#f0fdfa] text-[#0d9488] hover:bg-[#ccfbf1] transition font-medium">Otwórz</button>
                  ) : (
                    <button onClick={handleClose}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium">Zakończ</button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg, idx) => {
                  const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                  return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center text-[10px] text-zinc-400 mb-2 mt-1">
                        {new Date(msg.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    )}
                    <div className={`flex group ${msg.role === "user" || msg.role === "human" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user" ? "bg-[#0d9488] text-white rounded-br-md" :
                        msg.role === "human" ? "bg-brand-200 text-zinc-800 rounded-br-md" :
                        "bg-brand-50 text-zinc-800 rounded-bl-md"
                      }`}>
                        {msg.role === "human" && <div className="text-[10px] font-semibold text-brand-700 mb-0.5">Konsultant</div>}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-zinc-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <button onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition self-start mt-2 ml-1 text-zinc-400 hover:text-red-500 shrink-0 p-0.5 rounded"
                        title="Usuń wiadomość">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {selected.status !== "ended" && (
                <div className="border-t border-zinc-100 p-3 bg-white">
                  <div className="flex gap-2">
                    <textarea ref={inputRef}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                      placeholder="Napisz odpowiedź..." rows={1}
                      className="flex-1 bg-zinc-50 text-zinc-900 text-sm rounded-xl px-3 py-2.5 placeholder-zinc-400 border border-zinc-200 focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] outline-none resize-none"
                      disabled={sending} />
                    <button onClick={handleSend} disabled={sending}
                      className="shrink-0 bg-[#0d9488] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50">{sending ? "..." : "Wyślij"}</button>
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
