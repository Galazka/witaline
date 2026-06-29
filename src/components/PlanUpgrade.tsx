"use client";

import { useState, useEffect } from "react";
import { billingModels, getPlanConfig } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

interface Props {
  businessId: string;
  currentPlan: PlanKey;
  minutesUsed: number;
  onUpdate: () => void;
  business?: { created_at?: string };
}

export default function PlanUpgrade({
  businessId,
  currentPlan,
  minutesUsed,
  onUpdate,
  business,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [topupMinutes, setTopupMinutes] = useState(50);
  const [message, setMessage] = useState("");
  const [subStatus, setSubStatus] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/stripe/status?businessId=${businessId}`)
      .then((r) => r.json())
      .then((d) => setSubStatus(d.status || ""))
      .finally(() => setChecking(false));
  }, [businessId]);

  async function handleSubscribe(model: string) {
    // Enterprise redirects to offer page
    if (model === "enterprise") {
      window.location.href = "/oferta-indywidualna";
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "elastic_0", businessId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setMessage(data.error || "Błąd płatności");
    setLoading(false);
  }

  async function handleBillingPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  const needsPayment = !subStatus || subStatus === "trialing" || subStatus === "incomplete" || subStatus === "past_due" || subStatus === "canceled";
  const trialDaysLeft = subStatus === "trialing" ? Math.max(0, 7 - Math.floor((Date.now() - new Date(business?.created_at || Date.now()).getTime()) / 86400000)) : 0;
  const trialExpired = subStatus === "trialing" && trialDaysLeft <= 0;
  const isBlocked = trialExpired || subStatus === "past_due" || subStatus === "canceled" || subStatus === "incomplete";

  async function handleTopup() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, action: "topup", value: topupMinutes }),
    });
    if (res.ok) {
      setMessage(`Dokupiono ${topupMinutes} minut`);
      onUpdate();
    } else {
      setMessage("Błąd dokupowania minut");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {!checking && needsPayment && (
        <div className={`border rounded-xl p-4 ${isBlocked ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <p className={"text-sm font-medium " + (isBlocked ? "text-red-800" : "text-amber-800")}>
            {subStatus === "past_due"
              ? "Twoja płatność jest zaległa. Zaktualizuj metodę płatności, aby uniknąć zawieszenia."
              : isBlocked
              ? "Twój okres próbny wygasł. Wybierz plan i opłać subskrypcję, aby kontynuować korzystanie z WitaLine."
              : subStatus === "trialing"
              ? `Masz ${trialDaysLeft} dni darmowego okresu próbnego. Wybierz plan poniżej, aby kontynuować po zakończeniu trialu.`
              : "Wybierz plan i skonfiguruj płatność, aby rozpocząć."}
          </p>
          <button
            onClick={subStatus === "past_due" ? handleBillingPortal : () => handleSubscribe("self_service")}
            disabled={loading}
            className="mt-3 bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
          >
            {subStatus === "past_due" ? "Zarządzaj płatnościami" : "Wybierz model i opłać"}
          </button>
        </div>
      )}

      {!checking && subStatus === "active" && (
        <div className="bg-brand-50 border border-[#0d9488]/20 rounded-xl p-4">
          <p className="text-sm text-[#0d9488]">
            Subskrypcja aktywna. Zarządzaj płatnościami i fakturami w Stripe.
          </p>
          <button
            onClick={handleBillingPortal}
            className="mt-2 text-sm text-[#0d9488] underline hover:text-[#0f766e]"
          >
            Panel płatności →
          </button>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Zmiana modelu współpracy
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {billingModels.map((model) => {
            const cp = currentPlan as string;
            const isCurrent = (model.key === "elastic_0" && (cp === "elastic_0" || cp === "self_service" || cp === "start_100" || cp === "pro_500")) || (model.key === "enterprise_2000" && cp === "enterprise_2000");
            return (
              <button
                key={model.key}
                onClick={() => handleSubscribe(model.key)}
                disabled={isCurrent || loading}
                className={`rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
                  isCurrent
                    ? "border-[#0d9488] bg-brand-50 ring-2 ring-[#0d9488]/20"
                    : "border-zinc-200 bg-white hover:border-[#0d9488]/30"
                } disabled:opacity-60`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{model.label}</p>
                    {isCurrent && <span className="text-[10px] text-[#0d9488] font-medium">Aktualny model</span>}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">{model.desc}</p>
                <ul className="space-y-1">
                  {model.features.map((f) => (
                    <li key={f} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                      <span className="text-[#0d9488] shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Dokup dodatkowe minuty
        </h3>
        <p className="text-sm text-zinc-500 mb-3">
          Wykorzystano {minutesUsed} minut w tym tygodniu.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={10}
            max={10000}
            step={10}
            value={topupMinutes}
            onChange={(e) => setTopupMinutes(parseInt(e.target.value) || 0)}
            className="w-28 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition"
          />
          <button
            onClick={handleTopup}
            disabled={loading || topupMinutes < 1}
            className="bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
          >
            Dokup
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-[#0d9488] bg-brand-50 px-3 py-2 rounded-lg">{message}</p>
      )}
    </div>
  );
}




