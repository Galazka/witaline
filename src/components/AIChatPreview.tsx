"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMessage {
  role: "client" | "maja";
  text: string;
}

const conversations: ChatMessage[][] = [
  [
    { role: "client", text: "Dzień dobry, chciałbym umówić się na wizytę u dentysty." },
    { role: "maja", text: "Dzień dobry! Oczywiście, chętnie pomogę. Który termin byłby dla Pana dogodny?" },
    { role: "client", text: "Najlepiej w przyszły poniedziałek, około 10:00." },
    { role: "maja", text: "Świetnie, mamy wolny termin w poniedziałek o 10:00. Proszę o imię i nazwisko, zapiszę Pana." },
  ],
  [
    { role: "client", text: "Czy macie wolne stoliki na dziś wieczór?" },
    { role: "maja", text: "Sprawdzam dostępność... Na dziś wieczór mamy ostatni wolny stolik o 20:00. Na ile osób?" },
    { role: "client", text: "Na dwie osoby." },
    { role: "maja", text: "Rezerwuję stolik na dziś, 20:00, dla dwóch osób. Czy to na nazwisko Kowalski?" },
  ],
  [
    { role: "client", text: "Chciałem zapytać o stan mojego zamówienia." },
    { role: "maja", text: "Oczywiście, sprawdzę. Proszę podać numer zamówienia lub nazwę firmy." },
    { role: "client", text: "Zamówienie nr 1234, Restauracja Napoli." },
    { role: "maja", text: "Zamówienie nr 1234 jest w realizacji. Przewidywany czas dostawy to 45 minut. Wyślę SMS z potwierdzeniem." },
  ],
];

function Avatar({ role }: { role: "client" | "maja" }) {
  const isMaja = role === "maja";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isMaja ? "bg-brand-400 text-white" : "bg-brand-100 text-zinc-500"
      }`}
    >
      {isMaja ? "M" : "K"}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-brand-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-brand-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-brand-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function AIChatPreview() {
  const [convIndex, setConvIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = conversations[convIndex];

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleCount, showTyping, scrollToBottom]);

  useEffect(() => {
    if (visibleCount >= conversation.length) {
      timeoutRef.current = setTimeout(() => {
        setConvIndex(prev => (prev + 1) % conversations.length);
        setVisibleCount(0);
        setShowTyping(false);
      }, 3000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    const isLastMaja = visibleCount > 0 && conversation[visibleCount - 1]?.role === "maja";
    if (isLastMaja) {
      setShowTyping(false);
      timeoutRef.current = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 1200);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    setShowTyping(true);
    timeoutRef.current = setTimeout(() => {
      setShowTyping(false);
      setVisibleCount(prev => prev + 1);
    }, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visibleCount, conversation]);

  return (
    <div className="bg-white border border-brand-100 shadow-sm rounded-2xl p-3 md:p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-brand-100">
        <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-zinc-500">Maja — asystent AI</span>
        <span className="text-[10px] text-brand-400/60 ml-auto">online</span>
      </div>

      <div ref={chatContainerRef} className="space-y-3 min-h-[200px] max-h-[260px] overflow-y-auto scroll-smooth">
        {conversation.slice(0, visibleCount).map((msg, i) => {
          const isMaja = msg.role === "maja";
          return (
            <div key={i} className={`flex items-start gap-2 ${isMaja ? "" : "flex-row-reverse"}`}>
              <Avatar role={msg.role} />
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  isMaja ? "bg-brand-400 text-white rounded-tl-sm" : "bg-white text-zinc-800 rounded-tr-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {showTyping && (
          <div className="flex items-start gap-2">
            <Avatar role="maja" />
            <div className="bg-brand-100 text-brand-600 px-3 py-2 rounded-2xl rounded-tl-sm text-sm">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
