"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, calculateSelfServicePrice, calculateElasticPrice, ELASTIC_TIERS, CONFIG, type SelfServiceConfig } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function formatPLN(n: number): string {
  return n.toFixed(2).replace(".", ",") + " zł";
}

interface PricingTr {
  overline: string;
  title: string;
  subtitle: string;
  popular: string;
  tryFree: string;
  freeFor: string;
  minVoice: string;
  chatUnlimited: string;
  overage: string;
  plnMin: string;
  [key: string]: string;
}

export default function PricingSection({
  tr,
  locale = "pl",
}: {
  tr: PricingTr;
  locale?: Locale;
}) {
  const [tab, setTab] = useState<"configurator" | "enterprise">("configurator");
  const [minutes, setMinutes] = useState(300);
  const [addons, setAddons] = useState({
    ownNumber: false, googleCalendar: false, crm: false,
    voiceClone: false, unlimitedConsultants: false, prioritySupport: false, sla247: false,
  });

  const elastic = calculateElasticPrice(minutes);
  const cfg: SelfServiceConfig = { minutes, ...addons };
  const full = calculateSelfServicePrice(cfg);

  function toggleAddon(key: keyof typeof addons) {
    setAddons(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const addonDefs: { key: keyof typeof addons; label: string; desc: string; price: number }[] = [
    { key: "ownNumber", label: "Własny numer +48", desc: "Dedykowany numer telefonu", price: CONFIG.addonOwnNumber },
    { key: "googleCalendar", label: "Google Calendar", desc: "Bot sam umawia wizyty", price: CONFIG.addonGoogleCalendar },
    { key: "crm", label: "Integracja CRM", desc: "HubSpot, Livespace, Pipedrive", price: CONFIG.addonCrm },
    { key: "voiceClone", label: "Klon głosu", desc: "Profesjonalny klon Twojego głosu", price: CONFIG.addonVoiceClone },
    { key: "unlimitedConsultants", label: "Nielimitowani konsultanci", desc: "Bez limitu przekierowań", price: CONFIG.addonUnlimitedConsultants },
    { key: "prioritySupport", label: "Priorytetowe wsparcie", desc: "Odpowiedź w 1h", price: CONFIG.addonPrioritySupport },
    { key: "sla247", label: "SLA 24/7", desc: "Gwarantowana dostępność", price: CONFIG.addonSla247 },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">{tr.overline}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">{tr.title}</h2>
          {tr.subtitle && <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">{tr.subtitle}</p>}
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <button onClick={() => setTab("configurator")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === "configurator" ? "bg-brand-400 text-white shadow-lg shadow-brand-500/30" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-brand-50"}`}>
            {locale === "en" ? "Minute slider" : "Suwak minut"}
          </button>
          <button onClick={() => setTab("enterprise")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === "enterprise" ? "bg-brand-400 text-white shadow-lg shadow-brand-500/30" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-brand-50"}`}>
            {locale === "en" ? "Enterprise" : "Indywidualnie"}
          </button>
        </div>

        {tab === "configurator" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Slider card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">{locale === "en" ? "How many minutes per month?" : "Ile minut miesięcznie?"}</h3>
              <p className="text-sm text-zinc-500 mb-6">{locale === "en" ? "Slide to choose — price drops with every 500-minute tier" : "Przesuń — cena spada z każdym progiem 500 minut"}</p>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-500">{locale === "en" ? "Minutes" : "Minuty"}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-brand-500 font-display">{minutes}</span>
                    <span className="text-sm text-zinc-400">{locale === "en" ? "min/mo" : "min/mies"}</span>
                  </div>
                </div>
                <input type="range" min={50} max={5000} step={10} value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-brand-100 rounded-full appearance-none cursor-pointer accent-brand-400" />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>50</span><span>1000</span><span>2000</span><span>3000</span><span>4000</span><span>5000</span>
                </div>
              </div>

              {/* Tier badges */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {ELASTIC_TIERS.filter(t => t.minMinutes > 0).map(t => (
                  <span key={t.minMinutes} className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${minutes >= t.minMinutes && minutes <= t.maxMinutes ? "bg-brand-400 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                    {t.minMinutes}–{t.maxMinutes}: {t.ratePerMin.toFixed(2).replace(".",",")} PLN/min
                  </span>
                ))}
              </div>

              {/* Price summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{locale === "en" ? "Per minute" : "Cena za minutę"}</p>
                  <p className="text-2xl font-bold text-brand-600">{formatPLN(elastic.ratePerMin)}</p>
                  <p className="text-[10px] text-zinc-400">{locale === "en" ? "netto" : "netto"}</p>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{locale === "en" ? "Monthly (netto)" : "Miesięcznie netto"}</p>
                  <p className="text-2xl font-bold text-brand-600">{formatPLN(elastic.monthlyNetto)}</p>
                  <p className="text-[10px] text-zinc-400">{locale === "en" ? "excl. VAT" : "+23% VAT"}</p>
                </div>
                <div className="bg-brand-50 rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{locale === "en" ? "Monthly (brutto)" : "Miesięcznie brutto"}</p>
                  <p className="text-2xl font-bold text-brand-600">{formatPLN(elastic.monthlyBrutto)}</p>
                  <p className="text-[10px] text-zinc-400">{locale === "en" ? "incl. VAT" : "z VAT"}</p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">{locale === "en" ? "Optional add-ons" : "Dodatki opcjonalne"}</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {addonDefs.map(a => (
                  <button key={a.key} onClick={() => toggleAddon(a.key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${addons[a.key] ? "border-brand-400 bg-brand-50" : "border-zinc-200 hover:border-brand-200"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${addons[a.key] ? "bg-brand-400 border-brand-400" : "border-zinc-300"}`}>
                        {addons[a.key] && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-zinc-700">{a.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-500">{a.price} zł/mies</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary + CTA */}
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-4">
                <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">{locale === "en" ? "Cost breakdown" : "Podsumowanie kosztów"}</h3>
                  <div className="space-y-2">
                    {full.details.map(d => (
                      <div key={d.label} className="flex justify-between text-sm">
                        <span className="text-zinc-500">{d.label}</span>
                        <span className="font-medium text-zinc-800">{formatPLN(d.netto)}</span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm font-bold">
                      <span className="text-zinc-700">{locale === "en" ? "Total netto" : "Razem netto"}</span>
                      <span className="text-brand-500">{formatPLN(full.monthlyNetto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">{locale === "en" ? "Total brutto" : "Razem brutto"}</span>
                      <span className="font-semibold text-zinc-800">{formatPLN(full.monthlyBrutto)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700">{locale === "en" ? "Test our AI assistant now" : "Sprawdź naszego asystenta AI"}</p>
                    <a href="tel:+48732125752" className="text-lg font-bold text-zinc-900 tracking-wide font-mono hover:text-brand-500 transition-colors">+48 732 125 752</a>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="sticky top-24 bg-white border-2 border-brand-400 rounded-2xl p-6 shadow-lg shadow-brand-500/10">
                  <p className="text-sm font-semibold text-zinc-700 mb-1">{locale === "en" ? "Your custom plan" : "Twój plan"}</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-brand-500 font-display">{formatPLN(full.monthlyBrutto)}</span>
                    <span className="text-zinc-400 text-xs">{locale === "en" ? "/mo" : "/mies"}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">{locale === "en" ? `netto: ${formatPLN(full.monthlyNetto)}` : `netto: ${formatPLN(full.monthlyNetto)}`}</p>

                  <div className="bg-brand-50 rounded-xl px-3 py-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{locale === "en" ? "Rate" : "Stawka"}</span>
                      <span className="text-sm font-bold text-brand-600">{formatPLN(elastic.ratePerMin)}/min netto</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-zinc-500">{locale === "en" ? "Overage" : "Nadwyżka"}</span>
                      <span className="text-sm font-bold text-brand-600">{formatPLN(full.overageNetto)}/min netto</span>
                    </div>
                  </div>

                  <Link href={{ pathname: "/register", query: { config: JSON.stringify(cfg) } }}
                    className="block w-full text-center bg-brand-400 text-white py-3 rounded-2xl font-semibold hover:bg-brand-500 transition shadow-lg shadow-brand-500/20">
                    {locale === "en" ? "Start free trial" : "Rozpocznij darmowy test"}
                  </Link>
                  <p className="text-center text-[10px] text-zinc-400 mt-2">{locale === "en" ? "No card · 7 days free" : "Bez karty · 7 dni za darmo"}</p>
                </div>
              </div>
            </div>


          </div>
        )}

        {tab === "enterprise" && <EnterpriseSection locale={locale} tr={tr} />}
      </div>
    </section>
  );
}

function EnterpriseSection({ locale, tr }: { locale: Locale; tr: PricingTr }) {
  const [minutes, setMinutes] = useState(2000);
  const base = Math.max(1500, minutes * 0.85);
  const monthlyNetto = Math.round(base * 100) / 100;
  const monthlyBrutto = Math.round(monthlyNetto * 1.23 * 100) / 100;
  const setupFee = 299;

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">{locale === "en" ? "Custom solution for your business" : "Indywidualne rozwiązanie dla Twojej firmy"}</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">{locale === "en" ? "Dedicated onboarding with our team, custom integrations, SLA guarantee, and pricing tailored to your company size." : "Dedykowany onboarding z naszym zespołem, niestandardowe integracje, gwarancja SLA i wycena dopasowana do Twojej firmy."}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <label className="text-sm font-semibold text-zinc-800 mb-3 block">{locale === "en" ? "Monthly voice minutes" : "Minuty rozmów miesięcznie"}</label>
          <input type="range" min={500} max={20000} step={100} value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value))}
            className="w-full h-2 bg-brand-100 rounded-full appearance-none cursor-pointer accent-brand-400 mb-2" />
          <div className="flex justify-between text-xs text-zinc-400"><span>500</span><span>5000</span><span>10000</span><span>20000+</span></div>
          <p className="text-center text-3xl font-bold text-brand-500 font-display mt-4">{minutes.toLocaleString("pl-PL")}</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="sticky top-24 bg-gradient-to-b from-brand-50 to-white border border-brand-200 rounded-2xl p-6 shadow-lg shadow-brand-500/10">
          <p className="text-sm font-semibold text-brand-700 mb-1">{locale === "en" ? "Starting from" : "Cena od"}</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-bold text-brand-500 font-display">{formatPrice(monthlyBrutto, locale)}</span>
            <span className="text-zinc-400 text-xs">{locale === "en" ? "/mo" : "/mies"}</span>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span className="text-zinc-600">{locale === "en" ? "Setup fee" : "Opłata wdrożeniowa"}</span><span className="font-medium">{setupFee} zł</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-600">{locale === "en" ? "Monthly (from)" : "Miesięcznie (od)"}</span><span className="font-medium">{formatPrice(monthlyBrutto, locale)}</span></div>
            <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm font-bold"><span className="text-zinc-700">{locale === "en" ? "First month" : "Pierwszy miesiąc"}</span><span className="text-brand-500">{formatPrice(monthlyBrutto + setupFee, locale)}</span></div>
          </div>
          <a href="tel:+48732125752" className="block w-full text-center bg-brand-400 text-white py-3 rounded-2xl font-semibold hover:bg-brand-500 transition shadow-lg shadow-brand-500/20 mb-2">{locale === "en" ? "Call us" : "Zadzwoń — +48 732 125 752"}</a>
          <a href="/oferta-indywidualna" className="block w-full text-center bg-white text-zinc-700 py-3 rounded-2xl font-semibold border border-zinc-200 hover:bg-brand-50 transition">{locale === "en" ? "See enterprise offer →" : "Zobacz ofertę indywidualną →"}</a>
        </div>
      </div>
    </div>
  );
}
