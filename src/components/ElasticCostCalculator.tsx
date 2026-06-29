"use client";

import { useState } from "react";
import { calculateElasticPrice, ELASTIC_TIERS, type ElasticPriceBreakdown } from "@/lib/pricing";

function formatPLN(n: number): string {
  return n.toFixed(2).replace(".", ",") + " zł";
}

export default function ElasticCostCalculator() {
  const [minutes, setMinutes] = useState(300);
  const price = calculateElasticPrice(minutes);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Kalkulator kosztów</h3>
        <p className="text-sm text-zinc-500">Przesuń suwak — cena spada z każdym progiem</p>
      </div>

      <div className="space-y-3">
        <input type="range" min={50} max={5000} step={10} value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value))}
          className="w-full h-2 bg-brand-100 rounded-full appearance-none cursor-pointer accent-[#0d9488]" />
        <div className="flex justify-between text-xs text-zinc-400">
          <span>50 min</span><span>1000</span><span>2500</span><span>5000</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-5xl font-bold text-[#0d9488] font-display">{minutes}</p>
        <p className="text-sm text-zinc-500 mt-1">minut rozmów miesięcznie</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#0d9488] bg-brand-50 p-4 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Stawka/min</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{price.ratePerMin.toFixed(2).replace(".", ",")} zł</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Netto/mies</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{price.monthlyNetto.toFixed(2).replace(".", ",")} zł</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Brutto/mies</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{price.monthlyBrutto.toFixed(2).replace(".", ",")} zł</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {ELASTIC_TIERS.map(t => (
          <span key={t.minMinutes} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${minutes >= t.minMinutes && minutes <= t.maxMinutes ? "bg-[#0d9488] text-white" : "bg-zinc-100 text-zinc-400"}`}>
            {t.minMinutes === 0 ? "0" : t.minMinutes}-{t.maxMinutes}: {t.ratePerMin.toFixed(2).replace(".",",")}
          </span>
        ))}
      </div>
    </div>
  );
}
