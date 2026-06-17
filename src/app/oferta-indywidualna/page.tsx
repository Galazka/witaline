"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";

const processSteps = [
  { step: "1", title: "Rozmowa diagnostyczna", desc: "30-minutowa rozmowa, podczas której poznajemy Twoją firmę, procesy i potrzeby. Żadnego formularza — po prostu rozmawiamy.", icon: "📞", duration: "30 min" },
  { step: "2", title: "Propozycja i wycena", desc: "Przygotowujemy szczegółową propozycję: architekturę rozmów, integracje i koszt. Dostajesz gotowy plan działania.", icon: "📋", duration: "~1 dzień" },
  { step: "3", title: "Konfiguracja za Ciebie", desc: "Budujemy bota, konfigurujemy scenariusze, podpinamy CRM, kalendarz i numer telefonu. Ty nie ruszasz palcem.", icon: "⚙️", duration: "~1 dzień" },
  { step: "4", title: "Testy i poprawki", desc: "Przeprowadzamy testy na Twoich przykładach. Wprowadzamy poprawki. Dopracowujemy, dopóki nie będzie idealnie.", icon: "🔍", duration: "~1 dzień" },
  { step: "5", title: "Start i opieka", desc: "Asystent odbiera pierwsze rozmowy. Monitorujemy, raportujemy. Jesteśmy z Tobą przez 30 dni — poprawki, zmiany, doradztwo.", icon: "🚀", duration: "30 dni opieki" },
];

const pricingRanges = [
  { label: "Do 500 min/mies", from: 499, to: 799, bestFor: "Małe firmy, restauracje, salony" },
  { label: "500 – 1500 min/mies", from: 799, to: 1499, bestFor: "E-commerce, agencje, serwisy" },
  { label: "1500 – 5000 min/mies", from: 1499, to: 3999, bestFor: "Call center, korporacje, sieci" },
  { label: "5000+ min/mies", from: 3999, to: null, bestFor: "Duże organizacje, indywidualna wycena" },
];

const competitorComparison = [
  { feature: "Wdrożenie i konfiguracja", witaline: "Robimy za Ciebie — 30 min rozmowy", other: "Samodzielnie lub płatny onboarding" },
  { feature: "Czas uruchomienia", witaline: "~3 dni", other: "2-6 tygodni" },
  { feature: "Dedykowany opiekun", witaline: "Tak — od pierwszego dnia", other: "Tylko w planach premium" },
  { feature: "Klon głosu", witaline: "Profesjonalny, 30 min nagrania", other: "Dodatkowo płatny lub brak" },
  { feature: "Integracja z CRM", witaline: "Konfigurujemy sami", other: "Wymaga wiedzy technicznej" },
  { feature: "SLA 24/7", witaline: "Tak — w cenie", other: "Dodatkowo płatny" },
  { feature: "Modyfikacje po wdrożeniu", witaline: "30 dni gratis, potem 100 PLN/mies", other: "Dodatkowo płatne" },
  { feature: "Cena", witaline: "Od 499 PLN/mies — wszystko wliczone", other: "Często ukryte koszty" },
];

export default function OfertaIndywidualnaPage() {
  const [inView, setInView] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.05 });
    const el = document.getElementById("page-root");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white" id="page-root">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/"><Logo size="sm" withTagline={false} /></Link>
          <div className="flex items-center gap-4">
            <a href="#proces" className="text-sm text-zinc-500 hover:text-brand-500 transition-colors">Proces</a>
            <a href="#cennik" className="text-sm text-zinc-500 hover:text-brand-500 transition-colors">Cennik</a>
            <a href="#porownanie" className="text-sm text-zinc-500 hover:text-brand-500 transition-colors">Porównanie</a>
            <a href="#faq" className="text-sm text-zinc-500 hover:text-brand-500 transition-colors">FAQ</a>
            <Link href="/register?plan=enterprise" className="btn-primary text-sm">Wybierz ten model</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={`relative overflow-hidden transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-50/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">Oferta indywidualna</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 font-display tracking-tight leading-[1.1] mb-6">
            Nie masz czasu na konfigurację?<br />
            <span className="gradient-text">Zróbmy to za Ciebie.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            Rozmawiasz z nami 30 minut. My konfigurujemy asystenta, podpinamy systemy i uruchamiamy.
            Ty zajmujesz się swoją firmą. Bez czytania instrukcji, bez kombinowania.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#cennik" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-brand-500/25">Sprawdź widełki cenowe</a>
            <a href="tel:+48732125752" className="inline-flex items-center gap-3 border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-xl px-6 py-3.5 transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="text-base font-semibold">+48 732 125 752</span>
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-y border-zinc-100 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-400">
            <span className="flex items-center gap-2"><span className="text-lg">🤝</span> <span className="font-medium text-zinc-500">Ponad 50 wdrożeń</span></span>
            <span className="flex items-center gap-2"><span className="text-lg">📞</span> <span className="font-medium text-zinc-500">Średnio -60% kosztów obsługi</span></span>
            <span className="flex items-center gap-2"><span className="text-lg">⭐</span> <span className="font-medium text-zinc-500">5.0 średnia ocen</span></span>
            <span className="flex items-center gap-2"><span className="text-lg">🔒</span> <span className="font-medium text-zinc-500">Pełna zgodność RODO</span></span>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Brzmi znajomo?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">Samodzielna konfiguracja bota nie jest dla każdego</h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              Narzędzia do budowania asystentów głosowych są coraz prostsze, ale wciąż wymagają czasu, wiedzy i cierpliwości. 
              Jeśli prowadzisz firmę, prawdopodobnie nie masz ani jednego, ani drugiego.
            </p>
            <ul className="space-y-3">
              {[
                "Nie wiesz od czego zacząć i jakie ustawienia wybrać?",
                "Boisz się, że bot będzie brzmiał nienaturalnie?",
                "Nie masz czasu na testowanie i poprawki?",
                "Chcesz, żeby działało od razu, a nie 'prawie'?",
              ].map((q) => (
                <li key={q} className="flex items-start gap-2 text-sm text-zinc-600">
                  <span className="w-5 h-5 bg-red-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <p className="font-semibold text-zinc-900">Dlatego właśnie powstała oferta indywidualna</p>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed mb-4">
              Oddaj nam całą konfigurację. My przeprowadzimy Cię przez proces od A do Z — od rozmowy 
              o Twoich potrzebach, przez budowę bota, aż po oficjalny start. Bez terminologii IT, bez 
              instrukcji, bez zbędnej korespondencji.
            </p>
            <div className="bg-white border border-brand-100 rounded-2xl p-4 text-sm">
              <p className="font-semibold text-zinc-900 mb-1">Twoja rola</p>
              <p className="text-zinc-500">Opowiedzieć nam o swojej firmie przez 30 minut.</p>
              <p className="font-semibold text-zinc-900 mt-3 mb-1">Nasza rola</p>
              <p className="text-zinc-500">Reszta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="proces" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Proces</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">Jak to działa krok po kroku</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Od pierwszej rozmowy do działającego asystenta — max 3 dni.</p>
          </div>
          <div className="space-y-4">
            {processSteps.map((step, i) => (
              <div key={step.step} className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 flex items-start gap-4 md:gap-6 hover:border-brand-200 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center shrink-0 text-sm">{step.step}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{step.icon}</span>
                    <h3 className="font-semibold text-zinc-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500">{step.desc}</p>
                </div>
                <div className="shrink-0 bg-brand-50 text-brand-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{step.duration}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 space-y-2">
            <p className="text-sm text-zinc-400">
              Łączny czas konfiguracji: <span className="font-semibold text-zinc-600">~3 dni</span> od rozmowy do uruchomienia.
            </p>
            <p className="text-sm text-zinc-400">
              Pierwsze 30 dni — <span className="font-semibold text-zinc-600">pełna opieka</span> w cenie: poprawki, zmiany, doradztwo. Potem możesz wykupić pakiet wsparcia.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing ranges */}
      <section id="cennik" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Cennik</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">Widełki cenowe — ile kosztuje opieka?</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Cena zależy od przewidywanego wolumenu rozmów. Wszystkie kwoty brutto (z VAT 23%).</p>
          </div>

          <div className="overflow-hidden border border-zinc-200 rounded-3xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-5 py-4 font-semibold text-zinc-900">Przedział minutowy</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-900">Cena od – do (brutto/mies)</th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-900 hidden md:table-cell">Dla kogo?</th>
                </tr>
              </thead>
              <tbody>
                {pricingRanges.map((range, i) => (
                  <tr key={range.label} className={`border-b border-zinc-100 last:border-0 hover:bg-brand-50/30 transition-colors ${i === 1 ? "bg-brand-50/20" : ""}`}>
                    <td className="px-5 py-4 font-medium text-zinc-900">{range.label}</td>
                    <td className="px-5 py-4">
                      <span className="text-brand-500 font-bold">{range.from} PLN</span>
                      {range.to ? <span className="text-zinc-400"> – {range.to} PLN</span> : <span className="text-zinc-400"> +</span>}
                    </td>
                    <td className="px-5 py-4 text-zinc-500 text-xs hidden md:table-cell">{range.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">📌</span>
              <div className="text-sm text-zinc-600">
                <p className="font-semibold text-zinc-900 mb-1">Co zawiera cena?</p>
                <p>Pełne wdrożenie (max 3 dni), konfiguracja bota, integracje, profesjonalny klon głosu, dedykowany opiekun, SLA 24/7, wsparcie techniczne i <strong>30 dni opieki</strong> — poprawki, zmiany, doradztwo. Bez limitu zgłoszeń.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-brand-100">
              <span className="text-lg shrink-0">🛡️</span>
              <div className="text-sm text-zinc-600">
                <p className="font-semibold text-zinc-900 mb-1">Pakiet wsparcia po okresie opieki — 100 PLN/mies</p>
                <p>Po pierwszych 30 dniach możesz wykupić pakiet wsparcia: priorytetowe zgłoszenia, zmiany w konfiguracji, edycja scenariuszy, pomoc techniczna. Dla firm, które chcą mieć pewność, że ktoś czuwa.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border border-zinc-200 rounded-3xl p-6 md:p-8">
            <h3 className="font-bold text-zinc-900 mb-4">Przykładowa miesięczna faktura</h3>
            <div className="space-y-3 text-sm">
              {[
                { item: "Wdrożenie (one-time)", amount: "299 PLN", note: "Tylko pierwszy miesiąc" },
                { item: "Abonament miesięczny (1500 min)", amount: "1 499 PLN", note: "Wszystko wliczone" },
                { item: "Pakiet wsparcia (opcjonalny)", amount: "100 PLN", note: "Po 30 dniach opieki" },
                { item: "Razem (pierwszy miesiąc)", amount: "1 798 PLN", note: "Potem od 1 499 PLN/mies + opcjonalne 100 PLN" },
              ].map((row) => (
                <div key={row.item} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="font-medium text-zinc-900">{row.item}</p>
                    <p className="text-xs text-zinc-400">{row.note}</p>
                  </div>
                  <p className="font-bold text-brand-500">{row.amount}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-4">Kwoty brutto. Pełna transparentność — żadnych dopłat, żadnych niespodzianek.</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="porownanie" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Porównanie</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">WitaLine vs samodzielna konfiguracja</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Sprawdź, co zyskujesz wybierając ofertę z opieką.</p>
          </div>

          <div className="overflow-hidden border border-zinc-200 rounded-3xl bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50 border-b border-zinc-200">
                  <th className="text-left px-5 py-4 font-semibold text-zinc-900 w-2/5"></th>
                  <th className="text-left px-5 py-4 font-semibold text-brand-600 w-3/10">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                      WitaLine — z opieką
                    </span>
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-zinc-400 w-3/10">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-300" />
                      Samodzielnie / inne
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitorComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-100 last:border-0 hover:bg-brand-50/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-900">{row.feature}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-brand-600">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {row.witaline}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cost calculator comparison */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">Ile oszczędzasz?</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Porównanie kosztów tradycyjnej recepcji vs asystenta WitaLine.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Recepcjonista na etacie",
                items: [
                  { label: "Wynagrodzenie", value: "4 500 PLN" },
                  { label: "ZUS i składki", value: "~1 500 PLN" },
                  { label: "Szkolenia", value: "300 PLN/mies" },
                  { label: "Urlop i L4", value: "~500 PLN/mies" },
                  { label: "Razem", value: "~6 800 PLN/mies", highlight: true },
                ],
                color: "red",
              },
              {
                title: "Asystent WitaLine",
                items: [
                  { label: "Abonament", value: "od 499 PLN" },
                  { label: "Minuty dodatkowe", value: "0,85 PLN/min" },
                  { label: "Wdrożenie (one-time)", value: "299 PLN" },
                  { label: "Wsparcie i opieka", value: "30 dni gratis" },
                  { label: "Razem", value: "od 499 PLN/mies", highlight: true },
                ],
                color: "green",
              },
              {
                title: "Oszczędność",
                items: [
                  { label: "Miesięcznie", value: "~6 300 PLN", highlight: true },
                  { label: "Rocznie", value: "~75 600 PLN", highlight: true },
                  { label: "Dodatkowe rozmowy", value: "+40% odebranych" },
                  { label: "Klienci po godzinach", value: "obsłużeni 24/7" },
                  { label: "Satysfakcja klientów", value: "5.0 ★★★★★" },
                ],
                color: "brand",
              },
            ].map((col) => (
              <div key={col.title} className={`bg-white border rounded-2xl p-5 ${col.color === "green" ? "border-brand-200 ring-1 ring-brand-100" : col.color === "red" ? "border-red-100" : "border-brand-100 bg-brand-50/30"}`}>
                <h3 className={`font-bold mb-4 text-sm ${col.color === "green" ? "text-brand-500" : col.color === "red" ? "text-red-500" : "text-brand-600"}`}>{col.title}</h3>
                <div className="space-y-2">
                  {col.items.map((item) => (
                    <div key={item.label} className={`flex items-center justify-between py-1.5 ${item.highlight ? "border-t border-zinc-100 pt-3 mt-1" : ""}`}>
                      <span className="text-xs text-zinc-500">{item.label}</span>
                      <span className={`text-xs font-bold ${item.highlight ? (col.color === "green" ? "text-brand-500" : col.color === "red" ? "text-red-500" : "text-brand-500") : "text-zinc-700"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-zinc-400">Koszty etatu: średnia krajowa + ZUS. Oszczędności mogą się różnić w zależności od wolumenu rozmów.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight mb-4">Najczęstsze pytania o ofertę indywidualną</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Czy muszę podpisać umowę na czas określony?", a: "Nie. Współpracujemy w systemie miesięcznym — możesz zrezygnować w każdej chwili bez konsekwencji. Żadnych umów na rok, żadnych klauzul." },
              { q: "Jak wygląda pierwsza rozmowa?", a: "Spokojna, luźna rozmowa — nie musisz przygotowywać żadnych dokumentów. Opowiedz nam o swojej firmie, klientach, procesach. My zrobimy resztę." },
              { q: "Co jeśli bot nie będzie działał idealnie?", a: "Nie oddajemy bota, dopóki nie przejdzie Twoich testów. A potem jesteśmy z Tobą przez 30 dni — poprawki, zmiany, dostosowania. Po tym okresie możesz wykupić pakiet wsparcia (100 PLN/mies) na dalsze modyfikacje i priorytetową pomoc." },
              { q: "Czy mogę później przejść na samodzielną konfigurację?", a: "Tak. W każdej chwili możesz zmienić model na Self-Service. Twoje ustawienia pozostają — po prostu przejmujesz ster." },
              { q: "Ile trwa wdrożenie?", a: "Od pierwszej rozmowy do uruchomienia — około 3 dni. Jeśli potrzebujesz szybciej, jesteśmy w stanie uruchomić podstawową wersję w 24h. Po starcie masz 30 dni opieki w cenie." },
              { q: "Czy dostanę fakturę?", a: "Tak. Wystawiamy faktury VAT z 14-dniowym terminem płatności. Możesz też płacić kartą lub BLIK-iem przez Stripe." },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
                  {faq.q}
                  <svg className={`w-5 h-5 text-zinc-400 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-4 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-400/10 via-transparent to-transparent" />
        <div className="max-w-3xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-4">Gotów, żebyśmy zajęli się resztą?</h2>
          <p className="text-brand-200/80 mb-8 max-w-xl mx-auto">Zostaw numer, oddzwonimy w 15 minut. Albo zadzwoń od razu — asystent odbiera 24/7.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="tel:+48732125752" className="inline-flex items-center gap-3 bg-white/[0.08] border border-white/15 hover:bg-white/[0.12] rounded-2xl px-6 py-3.5 transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-soft" />
              <span className="text-lg font-semibold">+48 732 125 752</span>
            </a>
            <Link href="/register?plan=enterprise" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-brand-500/25">Wybierz ten model</Link>
          </div>
          <p className="text-xs text-white/30 mt-4">Połączenie wg taryfy operatora. Oddzwaniamy w 15 minut — 7 dni w tygodniu.</p>
        </div>
      </section>
    </div>
  );
}