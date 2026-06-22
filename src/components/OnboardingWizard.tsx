"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { plans } from "@/lib/pricing";

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

function PlanIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}

function BotIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}

function PhoneIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
}

function GlobeIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
}

function CheckIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function LightbulbIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
}

function ArrowRightIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}

const STEPS = [
  { icon: PlanIcon, title: "Plan i numer", description: "Wybierz plan i numer telefonu" },
  { icon: BotIcon, title: "Prompt AI", description: "Dostosuj personality asystenta" },
  { icon: PhoneIcon, title: "Test rozmowy", description: "Zadzwon i przetestuj" },
  { icon: GlobeIcon, title: "Widget", description: "Wklej na swoja strone" },
  { icon: CheckIcon, title: "Gotowe", description: "Panel gotowy do pracy" },
];

const PLAN_LABELS: Record<string, string> = {
  start_100: "Start",
  pro_500: "Pro",
  enterprise_2000: "Enterprise",
  elastic_0: "Elastyczny",
  pro_249: "Pro",
  lux_599: "Lux",
};

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
  const [ownNumber, setOwnNumber] = useState(false);

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
    if (step === 1 && promptRef.current) {
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
        setMessage("Blad zapisu");
      }
    } catch {
      setMessage("Blad polaczenia");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  function getEmbedCode() {
    if (!business) return "";
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
          <Link href="/dashboard" className="text-brand-500 hover:underline">Przejdz do panelu</Link>
        </div>
      </div>
    );
  }

  const planLabel = PLAN_LABELS[business.plan] || business.plan;
  const planConfig = Object.values(plans).find(p => p.value === business.plan) || plans.self_service;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-brand-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="text-sm font-bold gradient-text">WitaLine</span>
          </div>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-700 transition">
            Pomin →
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
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
                  <span className="text-sm">{i < step ? <CheckIcon /> : <Icon />}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full mx-1 transition-colors ${i < step ? "bg-brand-400" : "bg-brand-100"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 md:p-8 animate-fade-in-up">
          {message && (
            <div className="mb-4 text-sm text-brand-600 bg-brand-50 rounded-xl px-4 py-2 animate-slide-in">
              {message}
            </div>
          )}

          {/* STEP 0: Plan + Number */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Twoj plan i numer</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Podsumowanie Twojego planu i numeru telefonicznego.
                </p>
              </div>

              <div className="bg-gradient-to-br from-brand-50 to-green-50 border border-brand-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-brand-600 font-medium uppercase tracking-wider">Aktualny plan</p>
                    <p className="text-xl font-bold text-zinc-900 mt-1">{planLabel}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/70 rounded-xl px-3 py-2">
                    <span className="text-zinc-400 text-xs">Minuty/mies</span>
                    <p className="font-semibold text-zinc-900">{planConfig.minutes}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl px-3 py-2">
                    <span className="text-zinc-400 text-xs">Cena</span>
                    <p className="font-semibold text-zinc-900">{planConfig.pricePLN}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Twoj numer telefoniczny</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-900 font-mono tracking-wider">
                      {business.twilioNumber ? `+48 ${business.twilioNumber}` : "Brak numeru"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Klienci dzwonia pod ten numer, aby rozmawiac z asystentem
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl p-4 cursor-pointer hover:bg-brand-50/50 transition">
                <input
                  type="checkbox"
                  checked={ownNumber}
                  onChange={e => setOwnNumber(e.target.checked)}
                  className="accent-brand-400 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Chce wlasny numer +48</p>
                  <p className="text-xs text-zinc-400">Dodatkowo 29 PLN/mies. Wlasny numer, ktory klienci rozpoznaja.</p>
                </div>
              </label>

              <div className="flex justify-end">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition flex items-center gap-2">
                  Dalej <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Customize Prompt */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Dostosuj prompt AI</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  To jest personality Twojego asystenta. Mozeesz go edytowac lub pominac domyslny prompt jest juz skonfigurowany.
                </p>
              </div>

              <div className="bg-brand-50 rounded-xl p-3 flex items-start gap-2">
                <span className="mt-0.5 shrink-0"><LightbulbIcon /></span>
                <p className="text-xs text-brand-700">
                  <strong>Wskazowka:</strong> Dodaj informacje o swojej firmie, godzinach otwarcia, uslugach i cenach. Im wiecej wiesz, tym lepiej asystent odpowiada klientom.
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
                <p className="text-xs text-zinc-400">{prompt.length} znakow</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrompt}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition disabled:opacity-50"
                  >
                    {saving ? "Zapisywanie..." : "Zapisz prompt"}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition flex items-center gap-2"
                  >
                    Dalej <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Test Call */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Przetestuj rozmowe</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Zadzwon na swoj numer lub wpisz swoj numer telefonu, a asystent oddzwoni.
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
                  Zadzwon pod ten numer, aby porozmawiac z <strong>{business.voiceName}</strong>
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2">Lub popros o oddzwonienie:</p>
                <div className="flex gap-2">
                  <input
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                  />
                  <button className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition">
                    Zadzwon do mnie
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition">
                  ← Wstecz
                </button>
                <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition flex items-center gap-2">
                  Dalej <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Widget */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Wklej widget na strone</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Dodaj czat AI na swoja strone www. Klienci moga pisac direct z przegladarki.
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Bezposredni link do czatu:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 border border-zinc-200 rounded-lg text-zinc-700 truncate">
                    {getDirectLink()}
                  </code>
                  <button
                    onClick={() => handleCopy("link")}
                    className="px-3 py-2 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition shrink-0"
                  >
                    {copied ? "Skopiowano" : "Kopiuj"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium">Kod embed (wklej przed &lt;/body&gt;):</p>
                <pre className="text-xs bg-white px-3 py-2 border border-zinc-200 rounded-lg text-zinc-700 overflow-x-auto whitespace-pre-wrap max-h-32">
                  {getEmbedCode()}
                </pre>
                <button
                  onClick={() => handleCopy("script")}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition"
                >
                  {copied ? "Skopiowano" : "Kopiuj kod"}
                </button>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-3 font-medium">Podglad widgetu:</p>
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
                        <p className="text-[10px] text-white/70">Asystent AI online</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-brand-50 rounded-xl rounded-bl-md px-3 py-2 text-xs text-zinc-700">
                        Dzien dobry! Jestem {business.voiceName}. W czym moge pomóc?
                      </div>
                      <div className="bg-brand-400 rounded-xl rounded-br-md px-3 py-2 text-xs text-white ml-8">
                        Jaki jest cennik?
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 p-2">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[10px] text-zinc-400">Napisz wiadomosc...</div>
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
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-brand-50 transition">
                  ← Wstecz
                </button>
                <button onClick={() => setStep(4)} className="px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-xl hover:bg-brand-500 transition flex items-center gap-2">
                  Dalej <ArrowRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto animate-fade-in-up">
                <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Wszystko gotowe!</h2>
                <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
                  Twoj asystent AI <strong>{business.voiceName}</strong> jest gotowy do pracy.
                  Odbiera telefony 24/7 i czeka na klientow.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 text-left max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Podsumowanie:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Firma:</span>
                    <span className="font-medium text-zinc-900">{business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Glos:</span>
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
                    <span className="font-medium text-zinc-900">{business.knowledgeCount} wpisow</span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-50 rounded-2xl p-6 text-left max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-brand-900 mb-3">Co dalej?</h3>
                <ul className="space-y-2 text-sm text-brand-700">
                  <li className="flex items-start gap-2">
                    <span>1.</span>
                    <span>Dodaj wiecej wiedzy o firmie w zakladce <strong>Konfiguracja</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>2.</span>
                    <span>Podlacz <strong>Google Calendar</strong> do rezerwacji online</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>3.</span>
                    <span>Przetestuj rozmowe i sprawdz transkrypcje</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="inline-block bg-brand-400 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20"
              >
                Przejdz do panelu →
              </Link>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-zinc-400">
            Krok {step + 1} z {STEPS.length}: {STEPS[step].description}
          </p>
        </div>
      </div>
    </div>
  );
}
