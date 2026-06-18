"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { billingModels, plans } from "@/lib/pricing";
import { templates } from "@/lib/templates";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { PlanKey } from "@/types/database";

const STEPS = [
  { label: "Plan", icon: "📋" },
  { label: "Konto", icon: "🔑" },
  { label: "Firma", icon: "🏢" },
  { label: "Branża", icon: "🎯" },
];

function PlanSelector({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: string;
  onSelect: (plan: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam && Object.keys(plans).includes(planParam)) {
      onSelect(planParam);
    }
  }, []);

  return null;
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const [extension, setExtension] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState("self_service");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState("");
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [policy, setPolicy] = useState(false);
  const [scanning, setScanning] = useState(false);

  const supabase = createClient();

  const modelToPlan: Record<string, PlanKey> = {
    self_service: "elastic_0",
    enterprise: "enterprise_2000",
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (session === null) setSession(false);
    }, 3000);
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s);
      clearTimeout(timeout);
    }).catch(() => {
      clearTimeout(timeout);
      if (session === null) setSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => setSession(!!sess));
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  async function validateCouponCode() {
    if (!couponCode.trim()) { setCouponError(""); setCouponDiscount(null); setFinalPrice(null); return; }
    try {
      const res = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, plan: selectedPlan }) });
      const data = await res.json();
      if (res.ok && data.valid) {
        const original = plans[selectedPlan as keyof typeof plans].price;
        let discounted = original;
        if (data.coupon.discount_percent) discounted = Math.round(original * (1 - data.coupon.discount_percent / 100) * 100) / 100;
        else if (data.coupon.discount_amount) discounted = Math.max(0, Math.round((original - data.coupon.discount_amount) * 100) / 100);
        setCouponDiscount(data.coupon.discount_percent || (data.coupon.discount_amount ? -data.coupon.discount_amount : null));
        setFinalPrice(discounted);
        setCouponError("");
      } else { setCouponError(data.error || "Nieprawidlowy kupon"); setCouponDiscount(null); setFinalPrice(null); }
    } catch { setCouponError("Błąd"); }
  }

  function canNext(): boolean {
    if (step === 0) return !!selectedPlan;
    if (step === 1) return !!email && password.length >= 6 && password === passwordConfirm;
    if (step === 2) return !!businessName;
    return true;
  }

  function nextStep() { setError(""); if (step === 1 && !session) { supabase.auth.signUp({ email: email.trim(), password, options: { data: { businessName, industry } } }).then(({ error: e }) => { if (e?.message?.includes("already")) { supabase.auth.signInWithPassword({ email: email.trim(), password }).then(({ error: sErr }) => { if (sErr) { setError("Konto juz istnieje. Zaloguj sie."); return; } setStep(2); }); return; } if (e) { setError(e.message); return; } setStep(2); }); return; } setStep(s => Math.min(s + 1, 3)); }

  async function handleActivate() {
    setError(""); if (!industry) { setError("Wybierz branze"); return; } if (!policy) { setError("Zaakceptuj regulamin"); return; }
    setSaving(true);
    if (!session) { const { error: e } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { businessName, industry } } }); if (e) { setError(e.message.includes("already") ? "Konto juz istnieje." : e.message); setSaving(false); return; } }
    setScanning(true);
    const tpl = industry !== "custom" ? templates[industry] : undefined;
    const templatePrompt = tpl?.prompt?.replace("[nazwa]", businessName) || "";
    const scanRes = await fetch("/api/onboarding/scan-website", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: websiteUrl, businessName, industry, templatePrompt }) });
    const scanData = await scanRes.json();
    const prompt = scanData.systemPrompt || templatePrompt;
    setScanning(false);
    const res = await fetch("/api/onboarding/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: businessName, plan: modelToPlan[selectedPlan] || "elastic_0", systemPrompt: prompt, menuCatalog: {}, websiteUrl, phone, industry, templateId: industry !== "custom" ? industry : undefined, services: tpl?.services, calendarSettings: tpl?.calendar }) });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Blad"); setSaving(false); return; }
    const result = await res.json(); setExtension(result.extension); setDone(true); setSaving(false);
  }

  if (session === null) return <div className="flex-1 flex items-center justify-center min-h-screen"><p className="text-zinc-400">Ładowanie...</p></div>;

if (done) return (
  <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950">
    <div className="max-w-md text-center space-y-6 animate-fade-in-up">
      <div className="w-20 h-20 bg-brand-400/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white font-display">Konto aktywne!</h2>
      <p className="text-white/50">Tworzymy Twojego asystenta. Za chwilę przekierujemy Cię do kreatora.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/onboarding" className="inline-block bg-brand-400 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20">Rozpocznij konfigurację →
        </Link>
        <Link href="/dashboard" className="inline-block border border-white/15 text-white/70 px-6 py-3.5 rounded-2xl font-medium hover:border-white/25 hover:text-white transition-colors">Pomiń
        </Link>
      </div>
    </div>
  </div>
  );

  const inputClass = "w-full border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 transition-colors bg-white/10 text-white placeholder-white/40";
  const btnPrimary = "bg-brand-400 text-white py-3 rounded-xl font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50 text-sm";
  const btnSecondary = "border border-white/15 text-white/80 py-3 rounded-xl font-medium hover:border-white/25 hover:text-white transition-colors text-sm";

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Suspense fallback={null}>
        <PlanSelector selectedPlan={selectedPlan} onSelect={setSelectedPlan} />
      </Suspense>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-400/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6"><Logo size="md" /></Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-display">Rozpocznij z WitaLine</h1>
          <p className="text-sm text-white/60 mt-2">Skonfiguruj asystenta w 4 krokach. 7 dni za darmo.</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-xs font-semibold transition-all ${i === step ? "bg-brand-400 text-white shadow-md" : i < step ? "bg-brand-100 text-brand-600" : "bg-white/10 text-white/40"}`}>
                <span className="text-sm">{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && <div className={`w-8 h-0.5 rounded-full mx-1 transition-colors ${i < step ? "bg-brand-400" : "bg-white/15"}`} />}
            </div>
          ))}
        </div>

<div className="glass-card-dark p-6 md:p-8">
  {error && <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

          {/* STEP 0: Plan / Model */}
          {step === 0 && (
            <div>
<div className="bg-brand-400/10 border border-brand-400/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
  <span className="text-xl shrink-0">🎁</span>
  <div><p className="text-sm font-semibold text-brand-300">7 dni za darmo</p><p className="text-xs text-white/50 mt-0.5">Bez karty kredytowej. Anuluj w każdej chwili.</p></div>
</div>
<h2 className="text-lg font-semibold text-white mb-4">Wybierz model współpracy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {billingModels.map((model) => {
                  const sel = selectedPlan === model.key;
                  return (
                    <button key={model.key} onClick={() => { setSelectedPlan(model.key); setCouponDiscount(null); setFinalPrice(null); setCouponCode(""); setCouponError(""); }}
                      className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${sel ? "border-brand-500 bg-brand-50/50 shadow-sm" : "border-white/15 hover:border-brand-300"}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{model.icon}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{model.label}</div>
                          <div className="text-[10px] text-white/50 mt-0.5">{sel ? "Wybrany" : "Kliknij, aby wybrać"}</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed mb-3">{model.desc}</p>
                      <ul className="space-y-1.5">
                        {model.features.map((f) => (
                          <li key={f} className="text-xs text-white/50 flex items-start gap-2">
                            <span className="text-brand-400 mt-0.5 shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <button onClick={nextStep} disabled={!canNext()} className={`w-full mt-4 ${btnPrimary}`}>Dalej →</button>
            </div>
          )}

          {/* STEP 1: Konto */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-5">Dane do logowania</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.pl" className={inputClass} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Haslo</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 znakow" className={inputClass} /></div>
                  <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Powtorz haslo</label><input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Wpisz ponownie" className={inputClass} />{password && passwordConfirm && password !== passwordConfirm && <p className="text-xs text-red-500 mt-1">Hasla nie sa identyczne</p>}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className={`flex-1 ${btnSecondary}`}>← Wstecz</button>
                <button onClick={nextStep} disabled={!canNext()} className={`flex-[2] ${btnPrimary}`}>Dalej →</button>
              </div>
            </div>
          )}

          {/* STEP 2: Firma */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-5">Dane firmy</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Nazwa firmy <span className="text-red-400">*</span></label><input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="np. Pizzeria Napoli" className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Strona www</label><input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://twojafirma.pl" className={inputClass} /><p className="text-xs text-zinc-400 mt-1">AI zeskanuje ja, by poznac Twoja oferte</p></div>
                <div><label className="block text-sm font-medium text-zinc-700 mb-1.5">Telefon firmowy</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+48 123 456 789" className={inputClass} /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className={`flex-1 ${btnSecondary}`}>← Wstecz</button>
                <button onClick={() => setStep(3)} disabled={!canNext()} className={`flex-[2] ${btnPrimary}`}>Dalej →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Branza */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-2">Wybierz branze</h2>
              <p className="text-sm text-zinc-500 mb-5">Dzieki temu skonfigurujemy asystenta pod Twoje potrzeby</p>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {Object.entries(templates).map(([key, tpl]) => (
                  <button key={key} onClick={() => setIndustry(key)} className={`text-center rounded-2xl border-2 p-3 transition-all hover:shadow-md ${industry === key ? "border-brand-500 bg-brand-50" : "border-zinc-200 hover:border-brand-200"}`}>
                    <span className="text-2xl">{tpl.icon}</span>
                    <p className="text-xs font-medium text-zinc-900 mt-1 leading-tight">{tpl.name}</p>
                  </button>
                ))}
                <button onClick={() => setIndustry("custom")} className={`text-center rounded-2xl border-2 p-3 transition-all hover:shadow-md ${industry === "custom" ? "border-brand-500 bg-brand-50" : "border-zinc-200 hover:border-brand-200"}`}>
                  <span className="text-2xl">✏️</span>
                  <p className="text-xs font-medium text-zinc-900 mt-1">Inna</p>
                </button>
              </div>
              <label className="flex items-start gap-2 text-sm text-zinc-600 mb-6 cursor-pointer">
                <input type="checkbox" checked={policy} onChange={e => setPolicy(e.target.checked)} className="mt-0.5 accent-brand-400" />
                <span>Akceptuje <Link href="/regulamin" className="text-brand-400 underline">regulamin</Link> i <Link href="/polityka-prywatnosci" className="text-brand-400 underline">polityke prywatnosci</Link></span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className={`flex-1 ${btnSecondary}`}>← Wstecz</button>
                <button onClick={handleActivate} disabled={!industry || !policy || saving || scanning} className={`flex-[2] ${btnPrimary}`}>
                  {scanning ? "Skanowanie..." : saving ? "Aktywowanie..." : "Aktywuj konto"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
