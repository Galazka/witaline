"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const VoiceAgent = dynamic(() => import("@/components/VoiceAgent"), {
  ssr: false,
  loading: () => <div className="text-xs text-zinc-400">Ładowanie...</div>,
});

interface Message {
  role: "bot" | "user";
  text: string;
}

const WITALINE_KNOWLEDGE = `Jestes asystentem WitaLine. Firma oferuje automatyczna recepcje AI dla firm w Polsce.

## Oferta
- Bot telefoniczny AI 24/7 na wspolnym lub wlasnym numerze telefonu
- Widget na strone www
- Przyjmowanie zamowien, rezerwacji, zapytan przez telefon
- Transkrypcje wszystkich rozmow
- Panel zarzadzania z analityka

## Plany cenowe
- Elastyczny: 0 zl/mies — 0,69 zl/min, placisz tylko za uzycie
- Pro: 249 zl/mies — 300 minut wliczone, 0,59 zl za dodatkowa minute
- Lux: 599 zl/mies — 800 minut wliczone, 0,49 zl za dodatkowa minute

Chat i widget na stronie sa nielimitowane w kazdym planie.

## Numer telefonu
- Nie potrzebujesz wlasnego numeru — mozesz dzialac na wspolnym numerze WitaLine
- Wlasny numer (+48) mozna dokupic za 30 zl/mies
- W Pro i Lux: wlasny numer gratis przez 3 miesiace
- W Lux: wlasny numer staly, oplacamy go z naszej prowizji

## Jak zaczac
Rejestracja online w 5 minut. Bez karty kredytowej. 7 dni za darmo.

## Kontakt
Email: kontakt@witaline.pl

Odpowiadaj po polsku, krotko i naturalnie. Zachecaj do rejestracji i testowania.`;

const RODO_TEXT = "Zgodnie z RODO informujemy, ze rozmowy i korespondencja za posrednictwem tego widgetu sa analizowane przez asystenta AI i moga byc nagrywane w celu doskonalenia jakosci obslugi. Kontynuujac, wyrazasz zgode na przetwarzanie danych osobowych w celach obslugi zapytania.";
const GREETING = "Czesc! Jestem asystentem WitaLine. Opowiem Ci o naszym Systemie Gwarantowanego Odbierania Klientow 24/7. Plany juz od 0 zl/mies. O co chcialbys zapytac?";
const SUGGESTIONS = ["Ile kosztuje?", "Jak dziala?", "Jak zaczac?", "Co zyskuje?"];

export default function FloatingWidget() {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [tab, setTab] = useState<"chat" | "voice">("voice");
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (open && consented) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, consented]);

  async function send(text: string) {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const chatMessages = [...messages, userMsg].map(m => ({
        role: m.role === "bot" ? "assistant" as const : "user" as const,
        content: m.text,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, systemPrompt: WITALINE_KNOWLEDGE, businessName: "WitaLine", businessId: "00000000-0000-0000-0000-000000000001", channel: "widget", conversationId: convId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.conversationId && !convId) setConvId(data.conversationId);
      setMessages(prev => [...prev, { role: "bot", text: data.reply || "Przepraszam, sprobuj ponownie." }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Przepraszam, wystapil blad polaczenia. Sprobuj ponownie za chwile." }]);
    }
    setTyping(false);
  }

  const pulseRingClass = !open ? "before:absolute before:inset-0 before:rounded-full before:animate-ping before:bg-brand-400/30" : "";

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[99999] w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${pulseRingClass}`}
        style={{
          backgroundColor: open ? "#27272a" : "#3CBF4A",
          boxShadow: open
            ? "0 4px 24px rgba(0,0,0,0.25)"
            : "0 0 0 4px rgba(60,191,74,0.15), 0 8px 32px rgba(60,191,74,0.2)",
        }}
        aria-label={open ? "Zamknij widget" : "Otworz widget WitaLine"}
      >
        <span className="relative z-10 text-white">
          {open ? (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </span>
      </button>

      {/* PANEL - always rendered for pointer events to work */}
      <div
        className={`fixed bottom-20 sm:bottom-24 right-3 sm:right-4 md:right-6 w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] bg-white rounded-2xl border border-zinc-200 shadow-2xl flex-col overflow-hidden transition-all duration-300 pointer-events-auto`}
        style={{
          zIndex: 99998,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* RODO consent screen */}
        {!consented && (
          <div className="p-6 text-center space-y-5 min-h-[320px] flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">Bezpieczenstwo i RODO</h3>
              <p className="text-xs text-zinc-500 leading-relaxed select-text">{RODO_TEXT}</p>
            </div>
            <p className="text-[10px] text-zinc-400 select-text">
              Pelna tresc: <a href="/polityka-prywatnosci" target="_blank" className="text-brand-500 underline font-medium">Polityka prywatnosci</a>
            </p>
            <button onClick={() => setConsented(true)} className="bg-brand-400 text-white w-full py-3 rounded-2xl font-semibold text-sm hover:bg-brand-500 transition-colors shadow-sm cursor-pointer">
              Wyrazam zgode i kontynuuje
            </button>
            <button onClick={() => setOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
              Nie zgadzam sie — zamknij
            </button>
          </div>
        )}

        {consented && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">WitaLine</h3>
                  <p className="text-[11px] text-white/70">System Odbierania Klientow 24/7</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="flex gap-1 bg-white/10 rounded-xl p-1">
                <button onClick={() => setTab("chat")} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer ${tab === "chat" ? "bg-white/25 text-white shadow-sm" : "text-white/60 hover:bg-white/10"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Czat
                </button>
                <button onClick={() => setTab("voice")} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer ${tab === "voice" ? "bg-white/25 text-white shadow-sm" : "text-white/60 hover:bg-white/10"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Połącz głosowo
                </button>
              </div>
            </div>

            {/* CHAT TAB */}
            {tab === "chat" && (
              <>
                <div ref={chatRef} className="overflow-y-auto px-4 py-4 space-y-3 bg-white/50 min-h-[280px] max-h-[360px]">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "bot" && (
                        <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center mr-2 mt-0.5 shrink-0">
                          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      )}
                      <div className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-brand-400 text-white rounded-2xl rounded-br-md" : "bg-white text-zinc-800 rounded-2xl rounded-bl-md border border-zinc-100 shadow-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center mr-2 shrink-0">
                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-zinc-100 shadow-sm">
                        <div className="flex gap-1.5">
                          {[0, 150, 300].map(delay => (
                            <span key={delay} className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {messages.length <= 2 && (
                  <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="text-xs px-3.5 py-1.5 bg-white text-brand-600 rounded-full hover:bg-brand-50 border border-brand-200 font-medium transition-colors shadow-sm cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-zinc-100 bg-white p-3">
                  <div className="flex gap-2 items-center">
                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(input); }} placeholder="Napisz wiadomosc..."
                      className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 transition-all" />
                    <button onClick={() => send(input)} disabled={!input.trim() || typing}
                      className="w-10 h-10 bg-brand-400 text-white rounded-full flex items-center justify-center hover:bg-brand-500 disabled:opacity-30 shrink-0 transition-colors shadow-sm cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-zinc-300 mt-2">
                    Powered by <span className="text-brand-500 font-semibold">WitaLine</span>
                  </p>
                </div>
              </>
            )}

            {/* VOICE TAB */}
            {tab === "voice" && (
              <div className="flex flex-col min-h-[320px] bg-white/50">
                {/* Distinct voice header */}
                <div className="flex items-center gap-2 px-5 pt-4 pb-1">
                  <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">Połączenie głosowe</span>
                  <span className="text-[10px] text-zinc-400 ml-auto">mów do Maja przez mikrofon</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                  <VoiceAgent />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
