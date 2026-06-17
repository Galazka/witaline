"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface BusinessData {
  id: string;
  name: string;
  systemPrompt: string;
  industry: string;
  websiteUrl: string;
  phone: string;
  twilioNumber: string;
  plan: string;
  voiceName: string;
  knowledgeCount: number;
}

interface StepConfig {
  icon: string;
  title: string;
  description: string;
}

const STEPS: StepConfig[] = [
  { icon: "🤖", title: "Prompt AI", description: "Dostosuj personality asystenta" },
  { icon: "📞", title: "Test rozmowy", description: "Zadzwoń i przetestuj" },
  { icon: "🌐", title: "Widget", description: "Wklej na swoją stronę" },
  { icon: "✅", title: "Gotowe", description: "Panel gotowy do pracy" },
];

export default function OnboardingWizard() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/business/onboarding-status")
      .then(r => r.json())
      .then(data => {
        if (data.business) {
          setBusiness(data.business);
          setPrompt(data.business.systemPrompt || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (step === 0 && promptRef.current) {
      promptRef.current.style.height = "auto";
      promptRef.current.style.height = promptRef.current.scrollHeight + "px";
    }
  }, [step, prompt]);

  async function handleSavePrompt() {
    if (!business) return;
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, systemPrompt: prompt }),
      });
      if (res.ok) {
        setMessage("Prompt zapisany!");
        setBusiness(b => b ? { ...b, systemPrompt: prompt } : b);
      } else {
        setMessage("Błąd zapisu");
      }
    } catch {
      setMessage("Błąd połączenia");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  function getEmbedCode() {
    if (!business) return "";
    const widgetUrl = `${window.location.origin}/widget?business=${business.id}`;
    return `<!-- WitaLine AI Chat Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget.js';
    s.dataset.businessId = '${business.id}';
    s.dataset.position = 'bottom-right';
    s.dataset.theme = 'light';
    document.body.appendChild(s);
  })();
</script>`;
  }

  function getDirectLink() {
    if (!business) return "";
    return `${window.location.origin}/widget?business=${business.id}`;
  }

  function handleCopy(type: "script" | "link") {
    const text = type === "script" ? getEmbedCode() : getDirectLink();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-brand-50/30">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Nie znaleziono firmy</p>
          <Link href="/dashboard" className="text-brand-500 hover:underline">Przejdź do panelu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-brand-50/30">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="text-sm font-bold gradient-text">WitaLine</span>
          </div>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-700 transition">
            Pomiń →
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  i === step
                    ? "bg-brand-400 text-white shadow-md shadow-brand-400/20"
                    : i < step
                    ? "bg-brand-100 text-brand-600 cursor-pointer hover:bg-brand-200"
                    : "bg-brand-50 text-zinc-400"
                }`}
              >
                <span className="text-sm">{i < step ? "✓" : s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < 3 && (
                <div className={`w-8 h-0.5 rounded-full mx-1 transition-colors ${i < step ? "bg-brand-400" : "bg-brand-100"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 md:p-8 animate-fade-in-up">
          {message && (
            <div className="mb-4 text-sm text-brand-600 bg-brand-50 rounded-xl px-4 py-2 animate-slide-in">
              {message}
            </div>
          )}

          {/* STEP 0: Customize Prompt */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Dostosuj prompt AI</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  To jest personality Twojego asystenta. Możesz go edytować lub pominąć — domyślny prompt jest już skonfigurowany.
                </p>
              </div>

              <div className="bg-brand-50 rounded-xl p-3 flex items-start gap-2">
                <span className="text-sm mt-0.5">💡</span>
                <p className="text-xs text-brand-700">
                  <strong>Wskazówka:</strong> Dodaj informacje o swojej firmie, godzinach otwarcia, usługach i cenach. Im więcej wiesz, tym lepiej asystent odpowiada klientom.
                </p>
              </div>

              <textarea
                ref={promptRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 resize-none font-mono leading-relaxed"
                rows={12}
                placeholder="Prompt Twojego asystenta AI..."
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">{prompt.length} znaków</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrompt}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition disabled:opacity-50"
                  >
                    {saving ? "Zapisywanie..." : "Zapisz prompt"}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition"
                  >
                    Dalej →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Test Call */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Przetestuj rozmowę</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Zadzwoń na swój numer lub wpisz swój numer telefonu, a asystent oddzwoni.
                </p>
              </div>

              <div className="bg-gradient-to-r from-brand-50 to-green-50 border border-brand-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-zinc-900 font-mono tracking-wider">
                  {business.twilioNumber ? `+48 ${business.twilioNumber}` : "Brak numeru"}
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Zadzwoń pod ten numer, aby porozmawiać z <strong>{business.voiceName}</strong>
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2">Lub poproś o oddzwonienie:</p>
                <div className="flex gap-2">
                  <input
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                  />
                  <button className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition">
                    Zadzwoń do mnie
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(0)} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition">
                  ← Wstecz
                </button>
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition">
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Widget */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Wklej widget na stronę</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Dodaj czat AI na swoją stronę www. Klienci mogą pisać direct z przeglądarki.
                </p>
              </div>

              {/* Direct link */}
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Bezpośredni link do czatu:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 border border-zinc-200 rounded-lg text-zinc-700 truncate">
                    {getDirectLink()}
                  </code>
                  <button
                    onClick={() => handleCopy("link")}
                    className="px-3 py-2 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition shrink-0"
                  >
                    {copied ? "✓ Skopiowano" : "Kopiuj"}
                  </button>
                </div>
              </div>

              {/* Embed script */}
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Kod embed (wklej przed &lt;/body&gt;):</p>
                <pre className="text-xs bg-white px-3 py-2 border border-zinc-200 rounded-lg text-zinc-700 overflow-x-auto whitespace-pre-wrap max-h-32">
                  {getEmbedCode()}
                </pre>
                <button
                  onClick={() => handleCopy("script")}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition"
                >
                  {copied ? "✓ Skopiowano" : "Kopiuj kod"}
                </button>
              </div>

              {/* Preview */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-3 font-medium">Podgląd widgetu:</p>
                <div className="bg-brand-50 rounded-xl p-8 flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-lg w-72 overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-400 to-brand-500 px-4 py-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{business.name}</p>
                        <p className="text-[10px] text-white/70">Asystent AI — online</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-brand-50 rounded-xl rounded-bl-md px-3 py-2 text-xs text-zinc-700">
                        Dzień dobry! Jestem {business.voiceName}. W czym mogę pomóc?
                      </div>
                      <div className="bg-brand-400 rounded-xl rounded-br-md px-3 py-2 text-xs text-white ml-8">
                        Jaki jest cennik?
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 p-2">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[10px] text-zinc-400">Napisz wiadomość...</div>
                        <div className="w-6 h-6 bg-brand-400 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition">
                  ← Wstecz
                </button>
                <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition">
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto animate-fade-in-up">
                <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Wszystko gotowe! 🎉</h2>
                <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
                  Twój asystent AI <strong>{business.voiceName}</strong> jest gotowy do pracy.
                  Odbiera telefony 24/7 i czeka na klientów.
                </p>
              </div>

              {/* Quick summary */}
              <div className="bg-white rounded-2xl p-6 text-left max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Podsumowanie:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Firma:</span>
                    <span className="font-medium text-zinc-900">{business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Głos:</span>
                    <span className="font-medium text-zinc-900">{business.voiceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Numer:</span>
                    <span className="font-medium text-zinc-900 font-mono">
                      {business.twilioNumber ? `+48 ${business.twilioNumber}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Baza wiedzy:</span>
                    <span className="font-medium text-zinc-900">{business.knowledgeCount} wpisów</span>
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-brand-50 rounded-2xl p-6 text-left max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-brand-900 mb-3">Co dalej?</h3>
                <ul className="space-y-2 text-sm text-brand-700">
                  <li className="flex items-start gap-2">
                    <span>1.</span>
                    <span>Dodaj więcej wiedzy o firmie w zakładce <strong>Konfiguracja</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>2.</span>
                    <span>Podłącz <strong>Google Calendar</strong> do rezerwacji online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>3.</span>
                    <span>Przetestuj rozmowę i sprawdź transkrypcje</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="inline-block bg-brand-400 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
              >
                Przejdź do panelu →
              </Link>
            </div>
          )}
        </div>

        {/* Step info */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-400">
            Krok {step + 1} z {STEPS.length}: {STEPS[step].description}
          </p>
        </div>
      </div>
    </div>
  );
}
