"use client";

import { useState, useEffect, useRef } from "react";
import { templates } from "@/lib/templates";
import { WITALINE_CONTACT_EMAIL } from "@/lib/constants";

interface Message {
  role: "bot" | "user";
  text: string;
  timestamp: number;
}

interface Props {
  industry: string;
  businessName: string;
}

const WITALINE_KNOWLEDGE = `## O WitaLine
WitaLine to polska platforma automatycznej recepcji AI dla firm.

## Co oferujemy
- Bot telefoniczny AI 24/7 na własnym numerze telefonu
- Voice widget na stronę internetową (czat głosowy)
- Przyjmowanie zamówień, rezerwacji, zapytań przez telefon
- Transkrypcje wszystkich rozmów
- Panel zarządzania z analtyką i statystykami
- Dedykowany numer telefonu (+48) dla każdej firmy
- Możliwość przeniesienia własnego numeru

## Plany cenowe
- Elastyczny: 0 zł/mies — 0,69 zł/min, płacisz tylko za użycie
- Pro: 249 zł/mies — 300 minut wliczone, 0,59 zł za dodatkową minutę
- Lux: 599 zł/mies — 800 minut wliczone, 0,49 zł za dodatkową minutę

## Jak to działa
1. Rejestracja online (5 minut)
2. Wybór planu i branży
3. AI skanuje stronę www i generuje wiedzę bota
4. Bot od razu odbiera telefony, widget gotowy

## Kontakt
Strona: witaline.pl | Email: ${WITALINE_CONTACT_EMAIL}`;

function getIndustryLabel(industry: string): string {
  const labels: Record<string, string> = {
    witaline: "automatyczna recepcja AI",
    restaurant: "gastronomia",
    beauty: "beauty",
    medical: "medycyna",
    legal: "prawo",
    fitness: "fitness",
    moto: "motoryzacja",
    nieruchomosci: "nieruchomości",
    edukacja: "edukacja",
    turystyka: "turystyka",
    it_tech: "IT/tech",
    weterynaryjne: "weterynaria",
    sklep: "sklep",
    transport: "transport",
    fotografia: "fotografia",
    dentysta: "stomatologia",
    fizjoterapia: "fizjoterapia",
    kwiaty: "kwiaciarnia",
  };
  return labels[industry] || industry;
}

function getIndustryGreeting(industry: string, name: string): string {
  const greetings: Record<string, string> = {
    witaline: `Cześć! Jestem asystentem WitaLine 🎙️\nPomogę Ci dowiedzieć się jak automatyczna recepcja AI może odmienić Twoją firmę.\n\nCo chciałbyś wiedzieć?`,
    restaurant: `Dzień dobry! Witamy w ${name}. Chętnie przyjmę rezerwację lub zamówienie. W czym mogę pomóc?`,
    beauty: `Dzień dobry! Salon ${name} zaprasza. Umówię wizytę lub odpowiem na pytania o naszą ofertę. Słucham!`,
    medical: `Dzień dobry. Gabinet ${name} — umówię wizytę lub pomogę w wyborze usługi. Proszę o szczegóły.`,
    legal: `Dzień dobry. Kancelaria ${name} — umówię konsultację prawną. W czym mogę pomóc?`,
    fitness: `Cześć! Klub ${name} — zapiszę na zajęcia lub pomogę wybrać karnet. Co Cię interesuje?`,
    moto: `Dzień dobry! Warsztat ${name} — umówię przegląd lub naprawę. Opisz problem, a pomogę.`,
    nieruchomosci: `Dzień dobry! Biuro ${name} — pomogę znaleźć nieruchomość lub umówić oględziny. Słucham.`,
    edukacja: `Dzień dobry! ${name} — umówię lekcję lub konsultację. Jaki przedmiot Cię interesuje?`,
    turystyka: `Dzień dobry! ${name} — zarezerwuję pokój lub pomogę zaplanować wakacje. Dokąd się wybierasz?`,
    it_tech: `Dzień dobry! ${name} — przyjmę zgłoszenie serwisowe lub umówię konsultację techniczną. Opisz problem.`,
    weterynaryjne: `Dzień dobry! Gabinet weterynaryjny ${name} — umówię wizytę dla zwierzaka. Opisz co się dzieje.`,
    sklep: `Dzień dobry! Sklep ${name} — przyjmę zamówienie lub pomogę w wyborze produktu. Czego szukasz?`,
    transport: `Dzień dobry! Firma ${name} — wycenię transport lub sprawdzę status przesyłki. Podaj szczegóły.`,
    fotografia: `Dzień dobry! ${name} — umówię sesję fotograficzną. Jaka okazja? Ile osób?`,
    dentysta: `Dzień dobry! Gabinet ${name} — umówię wizytę. Czy to kontrola, czy konkretny problem?`,
    fizjoterapia: `Dzień dobry! Gabinet ${name} — umówię wizytę rehabilitacyjną. Opisz dolegliwość.`,
    kwiaty: `Dzień dobry! Kwiaciarnia ${name} — przyjmę zamówienie na kwiaty. Na jaką okazję?`,
  };
  return greetings[industry] || `Dzień dobry! Witamy w ${name}. W czym mogę pomóc?`;
}

function getIndustrySuggestions(industry: string): string[] {
  const suggestions: Record<string, string[]> = {
    witaline: ["Ile kosztuje WitaLine?", "Jak działa automatyczna recepcja?", "Jak zacząć za darmo?"],
    restaurant: ["Chcę zarezerwować stolik", "Ile kosztuje obiad dnia?", "Macie menu dla dzieci?"],
    beauty: ["Umów mnie na strzyżenie", "Ile kosztuje koloryzacja?", "Macie wolne w sobotę?"],
    medical: ["Chcę umówić wizytę", "Jakie badania wykonujecie?", "Ile kosztuje konsultacja?"],
    legal: ["Potrzebuję konsultacji prawnej", "Pomagacie w sprawach cywilnych?", "Ile kosztuje porada?"],
    fitness: ["Chcę kupić karnet", "Jakie macie zajęcia?", "Czy jest trener personalny?"],
    default: ["Jakie usługi oferujecie?", "Jaki jest cennik?", "Chcę umówić wizytę"],
  };
  return suggestions[industry] || suggestions.default;
}

export default function BotPreview({ industry, businessName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const template = templates[industry];
  const suggestions = getIndustrySuggestions(industry);
  const displayName = businessName || template?.name || "WitaLine";

  useEffect(() => {
    const timer = setTimeout(() => {
      const greeting = getIndustryGreeting(industry, displayName);
      setMessages([{ role: "bot", text: greeting, timestamp: Date.now() }]);
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [industry, displayName]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const currentMessages = [...messages, userMsg];
      const chatMessages = currentMessages.map(m => ({
        role: m.role === "bot" ? "assistant" as const : "user" as const,
        content: m.text,
      }));

      const systemPrompt = `${WITALINE_KNOWLEDGE}

## Kontekst
Nazwa: ${displayName}
Branża: ${getIndustryLabel(industry)}

Jesteś asystentem WitaLine. Odpowiadaj po polsku, naturalnie. Jeśli klient pyta o konkretną branżę — podkreśl że WitaLine obsługuje wszystkie branże.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, systemPrompt, businessName: displayName }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(errBody || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "bot",
        text: data.reply || "Przepraszam, nie mogłem przetworzyć wiadomości.",
        timestamp: Date.now(),
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Błąd połączenia";
      setMessages(prev => [...prev, {
        role: "bot",
        text: `Przepraszam, wystąpił błąd: ${msg}. Spróbuj ponownie.`,
        timestamp: Date.now(),
      }]);
    }

    setIsTyping(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-400 to-brand-500 px-5 py-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Asystent AI</h3>
          <p className="text-xs text-white/70">Online — odpowiada natychmiast</p>
        </div>
        <div className="text-xs text-white/50 font-mono">WitaLine</div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white/50">
        {!isLoaded && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "bot" && (
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-brand-400 text-white rounded-2xl rounded-br-md shadow-sm"
                : "bg-white text-zinc-800 rounded-2xl rounded-bl-md border border-zinc-100 shadow-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
              <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-zinc-100 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-brand-200 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-1.5 bg-white text-brand-600 rounded-full hover:bg-brand-50 transition border border-brand-200 shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-100 bg-white p-3">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(inputValue);
              }
            }}
            placeholder="Napisz wiadomość..."
            className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 bg-brand-400 text-white rounded-full flex items-center justify-center hover:bg-brand-500 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-300 mt-2">Powered by WitaLine AI</p>
      </div>
    </div>
  );
}
