"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getElasticRate, ElasticTier, ELASTIC_TIERS } from "@/lib/pricing";

export default function MinuteBalance({ businessId }: { businessId: string }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState(100);
  const [buying, setBuying] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("businesses").select("prepaid_minutes").eq("id", businessId).single().then(({ data }) => {
      if (data) setBalance(parseFloat(data.prepaid_minutes || "0"));
      setLoading(false);
    });
  }, [businessId]);

  const rate = getElasticRate(minutes);
  const totalNetto = Math.round(minutes * rate * 100) / 100;
  const totalBrutto = Math.round(totalNetto * 1.23 * 100) / 100;
  const currentTier = ELASTIC_TIERS.find(t => minutes >= t.minMinutes && minutes <= t.maxMinutes);
  const nextTier = currentTier ? ELASTIC_TIERS[ELASTIC_TIERS.indexOf(currentTier) + 1] : null;

  async function handleBuy() {
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

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Saldo minut</h3>
          <p className="text-xs text-zinc-500">Wykorzystujesz minuty z zakupionych pakietów.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-brand-500">
            {loading ? "..." : balance.toFixed(0)}
          </span>
          <span className="text-sm text-zinc-400 ml-1">min</span>
        </div>
      </div>

      <hr className="border-zinc-100" />

      <div>
        <h4 className="text-sm font-semibold text-zinc-900 mb-3">Kup pakiet minut</h4>
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
            {currentTier && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Próg</span>
                <span className="text-xs text-zinc-400">{currentTier.minMinutes}–{currentTier.maxMinutes} min</span>
              </div>
            )}
            {nextTier && (
              <p className="text-xs text-brand-500 pt-1">
                Przy pakiecie {nextTier.minMinutes} min stawka spada do {nextTier.ratePerMin.toFixed(2).replace(".", ",")} PLN/min
              </p>
            )}
          </div>

          <button
            onClick={handleBuy}
            disabled={buying}
            className="w-full bg-brand-400 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
          >
            {buying ? "Przekierowanie do Stripe..." : `Kup pakiet ${minutes} min`}
          </button>
        </div>
      </div>
    </div>
  );
}
