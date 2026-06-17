"use client";

import { getUsedPercentage, getPlanConfig } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

interface Props {
  minutesUsed: number;
  plan: PlanKey;
  totalSavingsMinutes: number;
  extension?: string | null;
  businessName?: string | null;
  tokensUsed?: number;
}

const PREMIUM_FEATURES: Record<PlanKey, string[]> = {
  start_100: [],
  pro_500: ["Podsumowania AI rozmów", "Baza wiedzy", "Rezerwacje online", "Priorytetowe wsparcie"],
  enterprise_2000: ["Podsumowania AI rozmów", "Baza wiedzy", "Rezerwacje online", "Priorytetowe wsparcie 24/7", "Google Calendar", "Własny prompt"],
  elastic_0: [],
  pro_249: ["Podsumowania AI rozmów", "Baza wiedzy", "Rezerwacje online", "Priorytetowe wsparcie"],
  lux_599: ["Podsumowania AI rozmów", "Baza wiedzy", "Rezerwacje online", "Priorytetowe wsparcie 24/7", "Google Calendar", "Własny prompt", "CRM", "Klon głosu"],
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export default function DashboardHeader({
  minutesUsed,
  plan,
  totalSavingsMinutes,
  extension,
  businessName,
  tokensUsed: tokensUsedProp,
}: Props) {
  const config = getPlanConfig(plan);
  const minsPct = getUsedPercentage(minutesUsed, plan);
  const tokensUsed = tokensUsedProp ?? Math.ceil(minutesUsed * 1000);
  const tokensPct = Math.min(100, Math.round((tokensUsed / config.monthlyTokens) * 100));
  const remainingMinutes = Math.max(0, config.monthlyVoiceMinutes - minutesUsed);
  const remainingTokens = Math.max(0, config.monthlyTokens - tokensUsed);
  const planLabels: Record<PlanKey, string> = {
    start_100: "Start",
    pro_500: "Growth",
    enterprise_2000: "Enterprise",
    elastic_0: "Elastyczny",
    pro_249: "Pro",
    lux_599: "Lux",
  };

  function barColor(pct: number): string {
    if (pct > 90) return "bg-red-500";
    if (pct > 75) return "bg-amber-500";
    return "bg-brand-500";
  }

  return (
    <div className="space-y-4">
      {extension && (
        <div className="bg-gradient-to-r from-brand-50 to-brand-100 border-2 border-brand-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-brand-600 uppercase tracking-wider mb-1">
              Twoja firma na WitaLine
            </p>
            <p className="text-lg font-bold text-zinc-900">
              {businessName || "Firma"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Klient może zadzwonić pod główny numer WitaLine i wpisać # [kod] *
              aby połączyć się bezpośrednio z Tobą
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl px-6 py-4 border border-brand-200 shadow-sm">
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Twój kod:</span>
            <span className="text-4xl font-bold text-brand-500 font-mono tracking-widest">
              # {extension} *
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {/* Pakiet */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Pakiet</p>
          <p className="text-lg font-semibold text-zinc-900">{planLabels[plan]}</p>
          <p className="text-xs text-zinc-400 mt-1">{config.label} · {config.pricePLN} PLN/mies</p>
        </div>

        {/* Minuty */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            ⏱️ Wykorzystane minuty
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-brand-400">{minutesUsed}</span>
            <span className="text-sm text-zinc-400">/ {config.monthlyVoiceMinutes} min</span>
          </div>
          <div className="w-full h-2 bg-brand-50 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor(minsPct)}`}
              style={{ width: `${minsPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-400">{minsPct}% wykorzystano</span>
            {remainingMinutes > 0 ? (
              <span className="text-brand-600 font-medium">~{remainingMinutes} min zostało</span>
            ) : (
              <span className="text-red-500 font-medium">Limit wyczerpany</span>
            )}
          </div>
        </div>

        {/* Tokeny */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            🪙 Tokeny
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-purple-500">{formatNumber(tokensUsed)}</span>
            <span className="text-sm text-zinc-400">/ {formatNumber(config.monthlyTokens)} tok</span>
          </div>
          <div className="w-full h-2 bg-brand-50 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor(tokensPct)}`}
              style={{ width: `${tokensPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-400">{tokensPct}% wykorzystano</span>
            {remainingTokens > 0 ? (
              <span className="text-purple-600 font-medium">{formatNumber(remainingTokens)} tok zostało</span>
            ) : (
              <span className="text-red-500 font-medium">Limit wyczerpany</span>
            )}
          </div>
        </div>

        {/* Zaoszczędzony czas */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            💰 Zaoszczędzony czas
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-brand-400">{totalSavingsMinutes}</span>
            <span className="text-sm text-zinc-400">minut obsłużonych przez AI</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Szac. oszczędność: ~{(totalSavingsMinutes / 60 * 35).toFixed(0)} PLN
          </p>
        </div>
      </div>

      {(plan === "start_100" || plan === "elastic_0") && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">⬆️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Odblokuj więcej dzięki planom Pro i Lux
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PREMIUM_FEATURES.pro_500.map((f) => (
                  <span key={f} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
