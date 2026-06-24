"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getElasticRate, ELASTIC_TIERS } from "@/lib/pricing";
import { SMS_PACKAGES, getSmsPricingConfig, getSmsRemaining, getWaRemaining, formatSmsCost, type SmsPricingConfig } from "@/lib/sms-pricing";

type Tab = "minutes" | "sms" | "whatsapp";

export default function AccountBalance({
  businessId,
  sessionUserUid,
}: {
  businessId: string;
  sessionUserUid?: string;
}) {
  const [tab, setTab] = useState<Tab>("minutes");
  const [balance, setBalance] = useState(0);
  const [smsData, setSmsData] = useState({ used: 0, limit: 0, extra: 0, remaining: 0, waUsed: 0, waLimit: 0, waExtra: 0, waRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [minutes, setMinutes] = useState(100);
  const [smsCount, setSmsCount] = useState(100);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("prepaid_minutes, sms_limit, sms_used, sms_extra_purchased, total_spent, wa_limit, wa_used, wa_extra_purchased")
        .eq("id", businessId)
        .maybeSingle();
      if (data && !error) {
        setBalance(parseFloat(data.prepaid_minutes || "0"));
        setSmsData({
          used: (data as any).sms_used || 0,
          limit: (data as any).sms_limit || 0,
          extra: (data as any).sms_extra_purchased || 0,
          remaining: getSmsRemaining(data as any),
          waUsed: (data as any).wa_used || 0,
          waLimit: (data as any).wa_limit || 0,
          waExtra: (data as any).wa_extra_purchased || 0,
          waRemaining: getWaRemaining(data as any),
        });
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
      else alert("Błąd: " + (data.error || "Nieznany błąd"));
    } catch {
      alert("Błąd połączenia");
    }
    setBuying(false);
  }

  // ─── SMS package ─────────────────────────────────────────────
  const pkg = SMS_PACKAGES.find(p => p.smsCount === smsCount) || SMS_PACKAGES[0];
  const smsPricePLN = pkg.clientPricePLN;
  const smsPricePerSms = pkg.pricePerSmsPLN;

  async function handleBuySms() {
    setBuying(true);
    try {
      const res = await fetch("/api/stripe/buy-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, smsCount }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Błąd: " + (data.error || "Nieznany błąd"));
    } catch {
      alert("Błąd połączenia");
    }
    setBuying(false);
  }

  // ─── Render ──────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = [
    { key: "minutes", label: "Minuty rozmów" },
    { key: "sms", label: "SMS" },
    { key: "whatsapp", label: "WhatsApp" },
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
                  <span className="text-zinc-500">Netto</span>
                  <span>{smsPricePLN.toFixed(2).replace(".", ",")} zł</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Brutto (23% VAT)</span>
                  <span>{(smsPricePLN * 1.23).toFixed(2).replace(".", ",")} zł</span>
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

      {/* ── Tab: WhatsApp ────────────────────────────────────────── */}
      {tab === "whatsapp" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3">
            <div>
              <span className="text-sm text-zinc-600">Dostępne WhatsApp</span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Limit: {smsData.waLimit} + dodatkowe: {smsData.waExtra}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-brand-500">
                {loading ? "..." : smsData.waRemaining}
              </span>
              <span className="text-xs text-zinc-400 ml-1">/ {smsData.waLimit + smsData.waExtra}</span>
              <p className="text-[10px] text-zinc-400">użyto: {smsData.waUsed}</p>
            </div>
          </div>

          {smsData.waLimit + smsData.waExtra > 0 && (
            <div className="bg-zinc-50 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  smsData.waRemaining < 10 ? "bg-red-500" : "bg-brand-400"
                }`}
                style={{ width: `${smsData.waRemaining > 0 ? ((smsData.waUsed / (smsData.waLimit + smsData.waExtra)) * 100) : 0}%` }}
              />
            </div>
          )}

          <hr className="border-zinc-100" />

          <p className="text-sm text-zinc-500 text-center py-4">
            WhatsApp Business pozwala wysyłać wiadomości klientom po rozmowie.
            <br />
            <span className="text-[10px] text-zinc-400">Kontakt z supportem w sprawie pakietów WhatsApp.</span>
          </p>
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
        <div className="flex justify-between">
          <span>WhatsApp</span>
          <span className="font-medium text-zinc-700">
            {smsData.waRemaining} / {smsData.waLimit + smsData.waExtra}
          </span>
        </div>
      </div>
    </div>
  );
}
