"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import dynamic from "next/dynamic";

const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), {
  ssr: false,
  loading: () => <div className="text-xs text-zinc-400 dark:text-zinc-500">Loading...</div>,
});

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Dzisiaj";
  if (d.toDateString() === yesterday.toDateString()) return "Wczoraj";
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

interface Message {
  role: "bot" | "user";
  text: string;
  timestamp: number;
}

interface BusinessData {
  name: string;
  systemPrompt: string;
  plan: string;
}

const STORAGE_KEY = (id: string) => `widget_conv_${id}`;

export default function WidgetPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const params = use(searchParams);
  const businessId = params.business;

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "voice">("chat");
  const [callDuration, setCallDuration] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const [transferRequested, setTransferRequested] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    // Load quick replies
    fetch(`/api/business/quick-replies?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setQuickReplies(data.map((qr: any) => qr.text)))
      .catch(() => {});

    const stored = localStorage.getItem(STORAGE_KEY(businessId));
    const initialConvId = stored || null;
    if (initialConvId) setConversationId(initialConvId);

    fetch(`/api/widget/${businessId}`)
      .then(r => r.json())
      .then(async (data) => {
        setBusiness(data);
        const greeting = `Dzień dobry! Jestem asystentem AI ${data.name || "firmy"}. W czym mogę pomóc?`;

        if (initialConvId) {
          try {
              const hres = await fetch(`/api/conversations/${initialConvId}/messages`);
              if (hres.ok) {
                const history = await hres.json();
                const restored: Message[] = ((history.messages || []) as any[]).map((m: any) => ({
                  role: m.role === "user" ? "user" : "bot",
                  text: m.content,
                  timestamp: new Date(m.created_at).getTime(),
                }));

                if (restored.length > 1) {
                  setMessages(restored);
                  const historyArr = (history.messages || []) as any[];
                  if (historyArr.length > 0) {
                    pollRef.current.lastId = historyArr[historyArr.length - 1].id;
                  }
                } else {
                  setMessages([{ role: "bot", text: greeting, timestamp: Date.now() }]);
                }
            } else {
              setMessages([{ role: "bot", text: greeting, timestamp: Date.now() }]);
            }
          } catch {
            setMessages([{ role: "bot", text: greeting, timestamp: Date.now() }]);
          }
        } else {
          setMessages([{ role: "bot", text: greeting, timestamp: Date.now() }]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  const pollRef = useRef<{ lastId: string | null }>({ lastId: null });
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        const incoming = (data.messages || []) as any[];
        if (incoming.length === 0) return;
        const lastServerId = incoming[incoming.length - 1].id;
        if (lastServerId === pollRef.current.lastId) return;
        pollRef.current.lastId = lastServerId;
        const updated: Message[] = incoming.map((m: any) => ({
          role: m.role === "user" ? "user" as const : "bot" as const,
          text: m.role === "human" ? `👤 Konsultant: ${m.content}` : m.content,
          timestamp: new Date(m.created_at).getTime(),
        }));
        setMessages(updated);
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (callActive) {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function handleSend(text: string) {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { role: "user", text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const chatMessages = [...messages, userMsg].map(m => ({
        role: m.role === "bot" ? "assistant" as const : "user" as const,
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          systemPrompt: business?.systemPrompt || "Jesteś asystentem AI. Odpowiadaj po polsku.",
          businessName: business?.name,
          businessId: businessId,
          conversationId: conversationId,
        }),
      });
      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        if (businessId) localStorage.setItem(STORAGE_KEY(businessId as string), data.conversationId);
      }
      setMessages(prev => [...prev, { role: "bot", text: data.reply || "Przepraszam, błąd.", timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Błąd połączenia.", timestamp: Date.now() }]);
    }
    setIsTyping(false);
  }

  async function handleRequestHuman() {
    if (!conversationId || !businessId || transferring) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/widget/${businessId}/request-human`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      if (res.ok) setTransferRequested(true);
    } catch { /* silent */ }
    setTransferring(false);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!businessId || !business) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center max-w-sm p-6">
          <div className="w-16 h-16 bg-[#ccfbf1] dark:bg-[#0d9488]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#0d9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Widget niedostępny</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Skonfiguruj widget w panelu administracyjnym.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d9488]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{business.name}</h3>
          <p className="text-xs text-white/70">Asystent &mdash; online</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-2 shrink-0">
        <button onClick={() => setTab("chat")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3 transition-all border-b-2 ${tab === "chat" ? "text-[#0d9488] dark:text-[#0d9488] border-[#0d9488]" : "text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Czat tekstowy
        </button>
        <button onClick={() => setTab("voice")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3 transition-all border-b-2 ${tab === "voice" ? "text-[#0d9488] dark:text-[#0d9488] border-[#0d9488]" : "text-zinc-400 dark:text-zinc-500 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Zadzwoń
          {callActive && <span className="text-[10px] bg-[#ccfbf1] dark:bg-[#0d9488]/20 text-[#0d9488] dark:text-[#0d9488] px-1.5 py-0.5 rounded-full font-mono">{formatDuration(callDuration)}</span>}
        </button>
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <>
          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <>
              {i === 0 || new Date(msg.timestamp).toDateString() !== new Date(messages[i - 1].timestamp).toDateString() ? (
                <div className="text-center my-4">
                  <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                    {formatDateHeader(new Date(msg.timestamp).toISOString())}
                  </span>
                </div>
              ) : null}
              <div key={msg.timestamp ? `${msg.role}-${msg.timestamp}` : i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#0d9488] text-white rounded-2xl rounded-br-md"
                    : "bg-[#f0fdfa] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-bl-md"
                }`}>
                  {msg.text}
                </div>
              </div>
            </>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#f0fdfa] dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transfer request */}
          {conversationId && !transferRequested && (
            <div className="px-3 sm:px-4 pt-2 shrink-0">
              <button
                onClick={handleRequestHuman}
                disabled={transferring}
                className="w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-[#0d9488] dark:hover:text-[#0d9488] transition flex items-center justify-center gap-1.5 py-2.5 sm:py-2 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-[#0d9488]/50 dark:hover:border-[#0d9488]/60"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {transferring ? "Proszę czekać..." : "Porozmawiaj z konsultantem"}
              </button>
            </div>
          )}
          {transferRequested && (
            <div className="px-3 sm:px-4 pt-2 shrink-0">
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2.5 sm:py-2 text-center">
                Prośba o konsultanta została wysłana. Konsultant odpowie tutaj.
              </div>
            </div>
          )}

          {/* Quick replies */}
          {quickReplies.length > 0 && messages.length > 0 && (
            <div className="px-3 sm:px-4 py-2 flex flex-wrap gap-1.5 shrink-0">
              {quickReplies.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  className="text-xs px-3 py-1.5 bg-[#f0fdfa] dark:bg-zinc-800 text-[#0d9488] dark:text-[#0d9488] rounded-full border border-[#0d9488]/20 dark:border-[#0d9488]/30 hover:bg-[#0d9488] hover:text-white transition"
                >
                  {text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 shrink-0">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(inputValue); }}
                placeholder="Napisz wiadomość..."
                className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 dark:focus:ring-[#0d9488]/50 transition-colors"
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 bg-[#0d9488] text-white rounded-full flex items-center justify-center hover:bg-[#0f766e] transition disabled:opacity-30 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-600 mt-2">Powered by <a href="https://witaline.pl" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-500 dark:hover:text-zinc-400 transition">WitaLine</a></p>
          </div>
        </>
      )}

      {/* Voice tab */}
      {tab === "voice" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-zinc-900/50 text-center gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Połącz się głosowo z asystentem</p>
          <VoiceAgent />
          <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-4">Powered by <a href="https://witaline.pl" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-500 dark:hover:text-zinc-400 transition">WitaLine</a></p>
        </div>
      )}
    </div>
  );
}
