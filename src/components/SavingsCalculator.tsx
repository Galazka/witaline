"use client";

import { useState } from "react";
import { getElasticRate } from "@/lib/pricing";

const RECEPTIONIST_MONTHLY = 5600;
const AVG_MIN_PER_CALL = 3;

export default function SavingsCalculator() {
  const [callsPerDay, setCallsPerDay] = useState(50);
  const [avgMinutes, setAvgMinutes] = useState(AVG_MIN_PER_CALL);
  const [receptionists, setReceptionists] = useState(1);

  const monthlyMinutes = callsPerDay * avgMinutes * 22;
  const rate = getElasticRate(monthlyMinutes);
  const witalineCost = Math.round(monthlyMinutes * rate * 100) / 100;
  const receptionistCost = receptionists * RECEPTIONIST_MONTHLY;
  const monthlySavings = Math.round((receptionistCost - witalineCost) * 100) / 100;
  const annualSavings = Math.round(monthlySavings * 12);
  const showSavings = monthlySavings > 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900 mb-1">Kalkulator oszczędności</h3>
      <p className="text-sm text-zinc-500 mb-6">Sprawdź ile oszczędzasz miesięcznie z WitaLine</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-600">Rozmów dziennie</span>
            <span className="font-semibold text-zinc-900">{callsPerDay}</span>
          </div>
          <input type="range" min={10} max={500} step={5} value={callsPerDay}
            onChange={e => setCallsPerDay(parseInt(e.target.value))}
            className="w-full accent-[#0d9488]" />
          <div className="flex justify-between text-xs text-zinc-400"><span>10</span><span>500</span></div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-600">Średni czas rozmowy</span>
            <span className="font-semibold text-zinc-900">{avgMinutes} min</span>
          </div>
          <input type="range" min={1} max={15} step={1} value={avgMinutes}
            onChange={e => setAvgMinutes(parseInt(e.target.value))}
            className="w-full accent-[#0d9488]" />
          <div className="flex justify-between text-xs text-zinc-400"><span>1 min</span><span>15 min</span></div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-600">Recepcjonistów</span>
            <span className="font-semibold text-zinc-900">{receptionists}</span>
          </div>
          <input type="range" min={1} max={5} step={1} value={receptionists}
            onChange={e => setReceptionists(parseInt(e.target.value))}
            className="w-full accent-[#0d9488]" />
          <div className="flex justify-between text-xs text-zinc-400"><span>1</span><span>5</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-red-500 mb-1">Koszt recepcji</p>
          <p className="text-xl font-bold text-red-600">{receptionistCost.toLocaleString("pl-PL")} zł</p>
          <p className="text-[10px] text-red-400">/ mies (etat + ZUS)</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-green-600 mb-1">Koszt WitaLine</p>
          <p className="text-xl font-bold text-green-600">{witalineCost.toLocaleString("pl-PL")} zł</p>
          <p className="text-[10px] text-green-500">{monthlyMinutes} min · {rate.toFixed(2).replace(".", ",")} zł/min</p>
        </div>
      </div>

      <div className={`mt-4 rounded-xl p-5 text-center ${showSavings ? "bg-brand-50" : "bg-zinc-50"}`}>
        {showSavings ? (
          <>
            <p className="text-xs text-[#0d9488] uppercase tracking-wider font-medium">Oszczędzasz miesięcznie</p>
            <p className="text-3xl font-bold text-[#0d9488] font-display">{monthlySavings.toLocaleString("pl-PL")} zł</p>
            <p className="text-xs text-[#0d9488] mt-1">Rocznie: {annualSavings.toLocaleString("pl-PL")} zł</p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">WitaLine kosztuje mniej niż etat już od 30 rozmów dziennie</p>
        )}
      </div>
    </div>
  );
}
