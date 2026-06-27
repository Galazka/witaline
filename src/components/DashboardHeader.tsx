"use client";

import { getUsedPercentage, getPlanConfig, getPlanLabel } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

interface Props {
  minutesUsed: number;
  plan: PlanKey;
  totalSavingsMinutes: number;
  extension?: string | null;
  businessName?: string | null;
  tokensUsed?: number;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  createdAt?: string;
}

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
  subscriptionStatus,
  trialEndsAt,
  createdAt,
}: Props) {
  const config = getPlanConfig(plan);
  const minsPct = getUsedPercentage(minutesUsed, config.monthlyVoiceMinutes);
  const tokensUsed = tokensUsedProp ?? Math.ceil(minutesUsed * 1000);
  const tokensPct = Math.min(100, Math.round((tokensUsed / config.monthlyTokens) * 100));
  const remainingMinutes = Math.max(0, config.monthlyVoiceMinutes - minutesUsed);
  const remainingTokens = Math.max(0, config.monthlyTokens - tokensUsed);
  const planLabel = getPlanLabel(plan);

  // Trial info
  const isTrialing = subscriptionStatus === "trialing";
  const createdDate = createdAt ? new Date(createdAt) : null;
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : (createdDate ? new Date(createdDate.getTime() + 7 * 86400000) : null);
  const now = new Date();
  const trialDaysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / 86400000)) : 0;
  const trialExpired = isTrialing && trialDaysLeft <= 0;
  const FREE_TRIAL_MINUTES = 15;
  const FREE_TRIAL_SMS = 10;
  const trialMinutesLeft = Math.max(0, FREE_TRIAL_MINUTES - minutesUsed);
  const trialMinutesExceeded = isTrialing && minutesUsed >= FREE_TRIAL_MINUTES;

  function barColor(pct: number): string {
    if (pct > 90) return "bg-red-500";
    if (pct > 75) return "bg-amber-500";
    return "bg-[#0d9488]";
  }

  return (
    <div className="space-y-4">
      {extension && (
        <div className="bg-gradient-to-r from-[#f0fdfa] to-[#ccfbf1] border-2 border-[#0d9488]/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#0d9488] uppercase tracking-wider mb-1">
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
          <div className="flex items-center gap-3 bg-white rounded-xl px-6 py-4 border border-[#0d9488]/20 shadow-sm">
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Twój kod:</span>
            <span className="text-4xl font-bold text-[#0d9488] font-mono tracking-widest">
              # {extension} *
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {/* Pakiet */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Pakiet</p>
          <p className="text-lg font-semibold text-zinc-900">{planLabel}</p>
          <p className="text-xs text-zinc-400 mt-1">{plan === "elastic_0" ? config.pricePLN : `${config.pricePLN} brutto/mies`}</p>
        </div>

        {/* Minuty */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            ⏱️ Wykorzystane minuty
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-[#0d9488]">{minutesUsed}</span>
            <span className="text-sm text-zinc-400">{config.monthlyVoiceMinutes ? `/ ${config.monthlyVoiceMinutes} min` : "min (pay-as-you-go)"}</span>
          </div>
          {config.monthlyVoiceMinutes > 0 && (
            <>
              <div className="w-full h-2 bg-brand-50 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor(minsPct)}`}
                  style={{ width: `${minsPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">{minsPct}% wykorzystano</span>
                {remainingMinutes > 0 ? (
                  <span className="text-[#0d9488] font-medium">~{remainingMinutes} min zostało</span>
                ) : (
                  <span className="text-red-500 font-medium">Limit wyczerpany</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tokeny */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            🪙 Tokeny
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-purple-500">{formatNumber(tokensUsed)}</span>
            <span className="text-sm text-zinc-400">{config.monthlyTokens ? `/ ${formatNumber(config.monthlyTokens)} tok` : "tok (pay-as-you-go)"}</span>
          </div>
          {config.monthlyTokens > 0 && (
            <>
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
            </>
          )}
        </div>

        {/* Zaoszczędzony czas */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            💰 Zaoszczędzony czas
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#0d9488]">{totalSavingsMinutes}</span>
            <span className="text-sm text-zinc-400">minut obsłużonych przez AI</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Szac. oszczędność: ~{(totalSavingsMinutes / 60 * 35).toFixed(0)} PLN
          </p>
        </div>
      </div>

      {isTrialing && (
        <div className={`border rounded-xl p-4 ${trialExpired ? "bg-red-50 border-red-200" : "bg-brand-50 border-[#0d9488]/20"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">{trialExpired ? "⛔" : "🎯"}</span>
              <div>
                <p className={`text-sm font-semibold ${trialExpired ? "text-red-800" : "text-brand-800"}`}>
                  {trialExpired
                    ? "Okres próbny wygasł"
                    : `Darmowy okres próbny — zostało ${trialDaysLeft} dni`}
                </p>
                <p className={`text-xs mt-1 ${trialExpired ? "text-red-600" : "text-[#0d9488]"}`}>
                  {trialExpired
                    ? "Dodaj środki, aby kontynuować korzystanie z WitaLine."
                    : `Bezpłatnie: ${FREE_TRIAL_MINUTES} min połączeń · ${FREE_TRIAL_SMS} SMS`}
                </p>
                <div className="flex gap-4 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${trialMinutesExceeded ? "bg-red-100 text-red-700" : "bg-white text-brand-700"}`}>
                    🎙️ {Math.min(minutesUsed, FREE_TRIAL_MINUTES)}/{FREE_TRIAL_MINUTES} min
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-white text-brand-700 rounded-full">
                    ✉️ 0/{FREE_TRIAL_SMS} SMS
                  </span>
                </div>
              </div>
            </div>
            {!trialExpired && (
              <a
                href="/dashboard?tab=upgrade"
                className="shrink-0 bg-[#0d9488] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#0d3d3a] transition text-center"
              >
                Dodaj środki
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
