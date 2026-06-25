"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getElasticRate, ELASTIC_TIERS } from "@/lib/pricing";
import { SMS_PACKAGES, getSmsPricingConfig, getSmsRemaining, formatSmsCost, type SmsPricingConfig } from "@/lib/sms-pricing";

type Tab = "minutes" | "sms";

export default function AccountBalance({
  businessId,
  sessionUserUid,
}: {
  businessId: string;
  sessionUserUid?: string;
}) {
  const [tab, setTab] = useState<Tab>("minutes");
  const [balance, setBalance] = useState(0);
  const [smsData, setSmsData] = useState({ used: 0, limit: 0, extra: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [minutes, setMinutes] = useState(100);
  const [smsCount, setSmsCount] = useState(100);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [trialMinutesUsed, setTrialMinutesUsed] = useState(0);
  const [trialSmsUsed, setTrialSmsUsed] = useState(0);
  const [isTrialing, setIsTrialing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const supabase = createClient();

  const FREE_TRIAL_MINUTES = 15;
  const FREE_TRIAL_SMS = 10;

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("prepaid_minutes, sms_limit, sms_used, sms_extra_purchased, subscription_status, trial_ends_at, trial_minutes_used, trial_sms_used, created_at")
        .eq("id", businessId)
        .maybeSingle();
      if (data && !error) {
        const d = data as any;
        setBalance(parseFloat(d.prepaid_minutes || "0"));
        setSmsData({
          used: d.sms_used || 0,
          limit: d.sms_limit || 0,
          extra: d.sms_extra_purchased || 0,
          remaining: getSmsRemaining(d),
        });
        setIsTrialing(d.subscription_status === "trialing");
        setTrialMinutesUsed(d.trial_minutes_used || 0);
        setTrialSmsUsed(d.trial_sms_used || 0);
        if (d.subscription_status === "trialing") {
          const trialEnd = d.trial_ends_at ? new Date(d.trial_ends_at) : new Date(new Date(d.created_at).getTime() + 7 * 86400000);
          setTrialDaysLeft(Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)));
        }
      }
    } catch (e) {
      console.warn("[AccountBalance] fetch error:", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [businessId]);

  // ─── Voice package ───────────────────────────────────────────
  const rate = getElasticRate(minutes);
  const totalNetto = Math.round(minutes * rate * 100) / 100;
  const totalBrutto = Math.round(totalNetto * 1.23 * 100) / 100;
  const currentTier = ELASTIC_TIERS.find(t => minutes >= t.minMinutes && minutes <= t.maxMinutes);
  const nextTier = currentTier ? ELASTIC_TIERS[ELASTIC_TIERS.indexOf(currentTier) + 1] : null;

  async function handleBuyMinutes() {
    setBuying(true);
    try {
      const res = await fetch("/api/stripe/buy-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, minutes }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPurchaseError(data.error || "Nieznany błąd");
    } catch {
      setPurchaseError("Błąd połączenia");
    }
    setBuying(false);
  }

  // ─── SMS package ─────────────────────────────────────────────
  const pkg = SMS_PACKAGES.find(p => p.smsCount === smsCount) || SMS_PACKAGES[0];
  const smsPricePLN = pkg.clientPricePLN;
  const smsPricePerSms = pkg.pricePerSmsPLN;

  async function handleBuySms() {
    setBuying(true);
    setPurchaseError("");
    try {
      const res = await fetch("/api/stripe/buy-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, smsCount }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPurchaseError(data.error || "Nieznany błąd");
    } catch {
      setPurchaseError("Błąd połączenia");
    }
    setBuying(false);
  }

  // ─── Render ──────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = [
    { key: "minutes", label: "Minuty rozmów" },
    { key: "sms", label: "SMS" },
  ];

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Stan konta</h3>
        <button
          onClick={fetchData}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition"
        >
          Odśwież
        </button>
      </div>

      {/* Error message */}
      {purchaseError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <span>{purchaseError}</span>
          <button onClick={() => setPurchaseError("")} className="ml-auto text-red-400 hover:text-red-600 text-xs">OK</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-50 p-1 rounded-lg">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isTrialing && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-800">
              🎯 Okres próbny — zostało {trialDaysLeft} dni
            </p>
            <a href="/dashboard?tab=upgrade" className="text-xs text-brand-600 font-medium hover:underline">
              Dodaj środki →
            </a>
          </div>
          <div className="flex gap-4">
            <span className="text-xs px-2 py-0.5 bg-white text-brand-700 rounded-full">
              🎙️ {Math.min(trialMinutesUsed, FREE_TRIAL_MINUTES)}/{FREE_TRIAL_MINUTES} min
            </span>
            <span className="text-xs px-2 py-0.5 bg-white text-brand-700 rounded-full">
              ✉️ {Math.min(trialSmsUsed, FREE_TRIAL_SMS)}/{FREE_TRIAL_SMS} SMS
            </span>
          </div>
        </div>
      )}

      {!isTrialing && (balance < 50 || smsData.remaining < 20) && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${(balance < 20 || smsData.remaining < 10) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <span>
            {balance < 20
              ? "Krytycznie niskie saldo minut! Doładuj konto aby nie przerwać obsługi połączeń."
              : balance < 50
              ? "Pozostało mało minut. Rozważ doładowanie aby uniknąć przerwy."
              : ""}
            {smsData.remaining < 10 && balance >= 20 && " "}
            {smsData.remaining < 10
              ? "Krytycznie niskie saldo SMS!"
              : smsData.remaining < 20
              ? "Pozostało mało SMS."
              : ""}
          </span>
        </div>
      )}

      {/* ── Tab: Minutes ────────────────────────────────────────── */}
      {tab === "minutes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
            <span className="text-sm text-zinc-600">Dostępne minuty</span>
            <span className="text-xl font-bold text-brand-500">
              {loading ? "..." : balance.toFixed(0)}
            </span>
          </div>

          <hr className="border-zinc-100" />

          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-3">Dokup pakiet minut</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">{minutes} min</span>
                  <span className="font-medium text-zinc-900">{totalNetto.toFixed(2).replace(".", ",")} zł netto</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={5000}
                  step={50}
                  value={minutes}
                  onChange={e => setMinutes(parseInt(e.target.value))}
                  className="w-full accent-brand-400"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>50 min</span>
                  <span>5000 min</span>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stawka</span>
                  <span className="font-medium">{rate.toFixed(2).replace(".", ",")} PLN/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Netto</span>
                  <span>{totalNetto.toFixed(2).replace(".", ",")} zł</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Brutto (23% VAT)</span>
                  <span>{totalBrutto.toFixed(2).replace(".", ",")} zł</span>
                </div>
                {nextTier && (
                  <p className="text-xs text-brand-500 pt-1">
                    Przy {nextTier.minMinutes}+ min stawka {nextTier.ratePerMin.toFixed(2).replace(".", ",")} PLN/min
                  </p>
                )}
              </div>

              <button
                onClick={handleBuyMinutes}
                disabled={buying}
                className="w-full bg-brand-400 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
              >
                {buying ? "Przekierowanie..." : `Kup ${minutes} min — ${totalBrutto.toFixed(2).replace(".", ",")} zł`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: SMS ────────────────────────────────────────────── */}
      {tab === "sms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
            <div>
              <span className="text-sm text-zinc-600">Dostępne SMS</span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Limit: {smsData.limit} + dodatkowe: {smsData.extra}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-brand-500">
                {loading ? "..." : smsData.remaining}
              </span>
              <span className="text-xs text-zinc-400 ml-1">/ {smsData.limit + smsData.extra}</span>
              <p className="text-[10px] text-zinc-400">użyto: {smsData.used}</p>
            </div>
          </div>

          {/* Usage bar */}
          {smsData.limit + smsData.extra > 0 && (
            <div className="bg-zinc-50 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  smsData.remaining < 10 ? "bg-red-500" : smsData.remaining < (smsData.limit + smsData.extra) * 0.25 ? "bg-amber-500" : "bg-brand-400"
                }`}
                style={{ width: `${smsData.remaining > 0 ? ((smsData.used / (smsData.limit + smsData.extra)) * 100) : 0}%` }}
              />
            </div>
          )}

          <hr className="border-zinc-100" />

          {/* SMS packages */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-3">Dokup pakiety SMS</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {SMS_PACKAGES.map((p) => (
                  <button
                    key={p.smsCount}
                    onClick={() => setSmsCount(p.smsCount)}
                    className={`px-2 py-2 rounded-xl border text-center transition ${
                      smsCount === p.smsCount
                        ? "border-brand-400 bg-brand-50"
                        : "border-zinc-200 hover:border-brand-200"
                    }`}
                  >
                    <div className="text-lg font-bold text-zinc-800">{p.smsCount}</div>
                    <div className="text-[10px] text-zinc-400">SMS</div>
                    <div className="text-xs font-semibold text-brand-500 mt-1">{p.clientPricePLN} zł</div>
                  </button>
                ))}
              </div>

              {/* Custom slider for SMS count */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600">{smsCount} SMS</span>
                  <span className="font-medium text-zinc-900">{smsPricePLN.toFixed(2).replace(".", ",")} zł</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={smsCount}
                  onChange={e => setSmsCount(parseInt(e.target.value))}
                  className="w-full accent-brand-400"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>10 SMS</span>
                  <span>1000 SMS</span>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cena za SMS</span>
                  <span className="font-medium">{smsPricePerSms.toFixed(2).replace(".", ",")} zł/SMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Całość (brutto)</span>
                  <span className="font-medium">{smsPricePLN.toFixed(2).replace(".", ",")} zł</span>
                </div>
              </div>

              <button
                onClick={handleBuySms}
                disabled={buying}
                className="w-full bg-brand-400 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
              >
                {buying ? "Przekierowanie..." : `Kup ${smsCount} SMS — ${smsPricePLN.toFixed(2).replace(".", ",")} zł`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary footer */}
      <div className="bg-zinc-50 rounded-xl px-4 py-3 text-xs text-zinc-500 space-y-1">
        <div className="flex justify-between">
          <span>Minuty głosowe</span>
          <span className="font-medium text-zinc-700">{balance.toFixed(0)} min</span>
        </div>
        <div className="flex justify-between">
          <span>SMS</span>
          <span className="font-medium text-zinc-700">
            {smsData.remaining} / {smsData.limit + smsData.extra}
          </span>
        </div>
      </div>
    </div>
  );
}
