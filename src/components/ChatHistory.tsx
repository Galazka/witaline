"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import type { Conversation, Message } from "@/types/database";

interface Props {
  businessId: string;
  businessPlan?: string;
}

const TAG_COLORS: Record<string, string> = {
  skarga: "bg-red-100 text-red-700 border-red-200",
  zamówienie: "bg-green-100 text-green-700 border-green-200",
  rezerwacja: "bg-blue-100 text-blue-700 border-blue-200",
  zapytanie: "bg-purple-100 text-purple-700 border-purple-200",
  reklamacja: "bg-orange-100 text-orange-700 border-orange-200",
  info: "bg-brand-50 text-zinc-600 border-zinc-200",
  pilne: "bg-amber-100 text-amber-700 border-amber-200",
  pozarejestracyjne: "bg-pink-100 text-pink-700 border-pink-200",
};

function getTagStyle(tag: string): string {
  const normalized = tag.toLowerCase().replace(/^#/, "");
  return TAG_COLORS[normalized] || "bg-brand-50 text-zinc-600 border-zinc-200";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active": return { label: "W trakcie", class: "bg-green-100 text-green-700" };
    case "ended": return { label: "Zakończona", class: "bg-brand-50 text-zinc-500" };
    case "archived": return { label: "Archiwalna", class: "bg-blue-100 text-blue-700" };
    default: return { label: status, class: "bg-brand-50 text-zinc-500" };
  }
}

function getSentimentEmoji(sentiment: string | null): string {
  switch (sentiment) {
    case "positive": return "😊";
    case "neutral": return "😐";
    case "negative": return "😟";
    default: return "—";
  }
}

const channelEmoji: Record<string, string> = {
  web: "💬", voice: "📞", sms: "📱", widget: "🔗",
};

function isPremiumPlan(plan?: string): boolean {
  return plan === "pro_500" || plan === "enterprise_2000" || plan === "pro_249" || plan === "lux_599";
}

export default function ChatHistory({ businessId, businessPlan }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, [businessId, filter]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    conversations.forEach(c => (c.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (tagFilter) {
      result = result.filter(c => (c.tags || []).includes(tagFilter));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.caller_name || "").toLowerCase().includes(term) ||
        (c.summary || "").toLowerCase().includes(term) ||
        (c.tags || []).some(t => t.toLowerCase().includes(term)) ||
        (c.caller_id || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [conversations, tagFilter, searchTerm]);

  async function fetchConversations() {
    setLoading(true);
    let query = supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter !== "all") query = query.eq("channel", filter);
    const { data } = await query;
    const convs = (data as Conversation[]) || [];
    setConversations(convs);
    setLoading(false);

    // Auto-generate summaries (premium: Pro/Enterprise only)
    if (isPremiumPlan(businessPlan)) {
      const needSummary = convs.filter(c => (c.status === "ended" || c.status === "archived") && !c.summary).slice(0, 5);
      for (const conv of needSummary) {
        try {
          const res = await fetch("/api/chat/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: conv.id, businessId }),
          });
          const data = await res.json();
          if (data.summary) {
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, summary: data.summary } : c));
          }
        } catch { /* silent */ }
      }
    }
  }

  async function fetchMessages(convId: string) {
    setMessagesLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setMessagesLoading(false);
  }

  async function generateSummary(conv: Conversation) {
    setSummarizing(conv.id);
    try {
      const res = await fetch("/api/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.id, businessId }),
      });
      const data = await res.json();
      if (data.summary) {
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, summary: data.summary } : c));
      }
    } catch { /* ignore */ }
    setSummarizing(null);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Wczoraj " + d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900">Historia rozmów</h3>
          <div className="flex gap-1">
            {["all", "web", "voice", "widget"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition ${filter === f ? "bg-brand-400 text-white" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"}`}>
                {f === "all" ? "Wszystkie" : f === "web" ? "💬 Web" : f === "voice" ? "📞 Voice" : "🔗 Widget"}
              </button>
            ))}
          </div>
        </div>
        {/* Search + tag filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po kliencie, tagu lub treści..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400" />
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tagFilter && (
              <button onClick={() => setTagFilter("")}
                className="text-xs px-2 py-1 rounded-full border border-zinc-300 bg-white text-zinc-500 hover:bg-brand-50 transition">
                ✕ Wyczyść filtr
              </button>
            )}
            {allTags.map(tag => (
              <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${tagFilter === tag ? "ring-2 ring-brand-400 ring-offset-1" : ""} ${getTagStyle(tag)}`}>
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation cards */}
      <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Ładowanie...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            {searchTerm || tagFilter ? "Brak rozmów pasujących do kryteriów" : "Brak rozmów"}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const statusBadge = getStatusBadge(conv.status);
            return (
              <div key={conv.id} className={`p-4 hover:bg-brand-50 transition cursor-pointer ${selectedConv?.id === conv.id ? "bg-brand-50" : ""}`}
                onClick={() => { setSelectedConv(conv); fetchMessages(conv.id); }}>
                {/* Top row: caller + channel + status + sentiment */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{channelEmoji[conv.channel] || "💬"}</span>
                  <span className="text-sm font-semibold text-zinc-900 truncate">
                    {conv.caller_name || conv.caller_id || "Anonimowy"}
                  </span>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                  <span className="text-xs" title="Sentyment">{getSentimentEmoji(conv.sentiment)}</span>
                </div>

                {/* Summary */}
                <div className="mb-1.5">
                  {conv.summary ? (
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{conv.summary}</p>
                  ) : isPremiumPlan(businessPlan) ? (
                    <button onClick={(e) => { e.stopPropagation(); generateSummary(conv); }}
                      disabled={summarizing === conv.id}
                      className="text-xs text-brand-400 hover:text-brand-500 transition flex items-center gap-1">
                      {summarizing === conv.id ? "Generowanie..." : "✨ Generuj podsumowanie AI"}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Podsumowania dostępne w planach Pro i Lux ⬆️</span>
                  )}
                </div>

                {/* Tags + time */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {(conv.tags || []).map(tag => (
                      <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getTagStyle(tag)}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-400 ml-auto shrink-0">{formatDate(conv.created_at)}</span>
                  {conv.duration_seconds > 0 && (
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {Math.floor(conv.duration_seconds / 60)}:{String(conv.duration_seconds % 60).padStart(2, "0")} min
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded conversation detail */}
      {selectedConv && (
        <div className="border-t border-zinc-200">
          <div className="px-5 py-3 bg-white border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {selectedConv.caller_name || selectedConv.caller_id || "Rozmowa"}
              </p>
              <p className="text-xs text-zinc-400">
                {channelEmoji[selectedConv.channel]} {selectedConv.channel} · {formatDate(selectedConv.created_at)}
              </p>
            </div>
            <button onClick={() => setSelectedConv(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition">
              ✕ Zamknij
            </button>
          </div>

          {selectedConv.summary && (
            <div className="px-5 py-3 bg-brand-50 border-b border-brand-100">
              <p className="text-xs font-medium text-brand-700 mb-1">📋 Podsumowanie rozmowy</p>
              <p className="text-sm text-brand-800 whitespace-pre-wrap">{selectedConv.summary}</p>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto px-5 py-4 space-y-3">
            {messagesLoading ? (
              <div className="text-center text-sm text-zinc-400 py-8">Ładowanie wiadomości...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-zinc-400 py-8">Brak wiadomości</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user" ? "bg-brand-400 text-white rounded-br-md" : "bg-brand-50 text-zinc-800 rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-zinc-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
