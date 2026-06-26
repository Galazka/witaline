"use client";

import { useState, type JSX } from "react";
import { ELASTIC_TIERS, calculateElasticPrice, INTERNAL_COST_PER_MIN } from "@/lib/pricing";

const PLANS = [
  { key: "elastic_0", label: "ELASTYCZNY", pricePLN: 0, includedMinutes: 0 },
  { key: "enterprise_2000", label: "ENTERPRISE", pricePLN: 999, includedMinutes: 1500 },
];

const EUR_RATE = 0.92;
const PLN_RATE = 4.00;

function fmtUSD(v: number) { return `$${v.toFixed(4)}`; }
function fmtEUR(v: number) { return `€${(v * EUR_RATE).toFixed(4)}`; }
function fmtPLN(v: number) { return `${(v * PLN_RATE).toFixed(4)} zł`; }

function fmtCurrRow(label: string, v: number) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500 w-20 shrink-0">{label}</span>
      <span className="font-mono text-zinc-600 w-24 text-right">{fmtUSD(v)}</span>
      <span className="font-mono text-zinc-500 w-24 text-right">{fmtEUR(v)}</span>
      <span className="font-mono text-zinc-900 w-28 text-right font-medium">{fmtPLN(v)}</span>
    </div>
  );
}

export default function AdminProfitability() {
  const [discount, setDiscount] = useState(0);
  const [elevenlabsPerMinUSD, setElevenlabsPerMinUSD] = useState(0.080);
  const [twilioSipMinUSD, setTwilioSipMinUSD] = useState(0.014);
  const [twilioNumberMoUSD, setTwilioNumberMoUSD] = useState(1.15);
  const [smsCostPerUnitUSD, setSmsCostPerUnitUSD] = useState(0.0779);
  const [smsPerCallPct, setSmsPerCallPct] = useState(5);
  const [avgCallDurationMin, setAvgCallDurationMin] = useState(3);
  const [orInputPrice, setOrInputPrice] = useState(0.15);
  const [orOutputPrice, setOrOutputPrice] = useState(1.00);
  const [tokensPerMin, setTokensPerMin] = useState(250);
  const [usdPlnRate, setUsdPlnRate] = useState(PLN_RATE);
  const [eurUsdRate, setEurUsdRate] = useState(EUR_RATE);
  const [inputPct, setInputPct] = useState(70);
  const [scale, setScale] = useState(50);

  function toPLN(usd: number) { return usd * usdPlnRate; }
  function toEUR(usd: number) { return usd * eurUsdRate; }

  const orCostPerTokenUSD = (inputPct / 100) * (orInputPrice / 1_000_000) + ((100 - inputPct) / 100) * (orOutputPrice / 1_000_000);
  const orCostPerMinUSD = orCostPerTokenUSD * tokensPerMin;
  const twilioPerMinUSD = twilioSipMinUSD + (twilioNumberMoUSD / 60 / 730);
  const smsCostPerMinUSD = (smsCostPerUnitUSD * smsPerCallPct / 100) / avgCallDurationMin;
  const totalCostPerMinUSD = elevenlabsPerMinUSD + orCostPerMinUSD + twilioPerMinUSD + smsCostPerMinUSD;
  const totalCostPerMinPLN = toPLN(totalCostPerMinUSD);

  return (
    <div className="space-y-6">
      {/* Koszty */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Koszty operacyjne</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">ElevenLabs ConvAI $/min</label>
            <input type="number" step="0.001" min="0" value={elevenlabsPerMinUSD} onChange={e => setElevenlabsPerMinUSD(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Twilio SIP $/min</label>
            <input type="number" step="0.001" min="0" value={twilioSipMinUSD} onChange={e => setTwilioSipMinUSD(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Twilio nr $/mc</label>
            <input type="number" step="0.01" min="0" value={twilioNumberMoUSD} onChange={e => setTwilioNumberMoUSD(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Twilio SMS $/sms</label>
            <input type="number" step="0.001" min="0" value={smsCostPerUnitUSD} onChange={e => setSmsCostPerUnitUSD(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Rozmów z SMS %</label>
            <input type="number" step="1" min="0" max="100" value={smsPerCallPct} onChange={e => setSmsPerCallPct(parseInt(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Śr. czas rozmowy (min)</label>
            <input type="number" step="0.5" min="0.5" value={avgCallDurationMin} onChange={e => setAvgCallDurationMin(parseFloat(e.target.value) || 1)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">OpenRouter input $/1M tok</label>
            <input type="number" step="0.01" min="0" value={orInputPrice} onChange={e => setOrInputPrice(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">OpenRouter output $/1M tok</label>
            <input type="number" step="0.01" min="0" value={orOutputPrice} onChange={e => setOrOutputPrice(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tokenów/min rozmowy</label>
            <input type="number" step="10" min="10" value={tokensPerMin} onChange={e => setTokensPerMin(parseInt(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Kurs USD/PLN</label>
            <input type="number" step="0.01" min="0" value={usdPlnRate} onChange={e => setUsdPlnRate(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Kurs EUR/USD</label>
            <input type="number" step="0.01" min="0" value={eurUsdRate} onChange={e => setEurUsdRate(parseFloat(e.target.value) || 0)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Input tokenów %</label>
            <input type="number" step="5" min="0" max="100" value={inputPct} onChange={e => setInputPct(parseInt(e.target.value) || 70)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
        </div>
      </div>

      {/* Discount slider */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Rabat</h2>
        <div className="flex items-center gap-4">
          <input type="range" min="0" max="50" step="1" value={discount} onChange={e => setDiscount(parseInt(e.target.value))} className="flex-1 accent-brand-400" />
          <span className="text-lg font-bold text-brand-400 min-w-[4rem] text-right">{discount}%</span>
        </div>
        <p className="text-xs text-zinc-400 mt-2">Rabat % dla symulacji — cena dla klienta jest pomniejszona o ten procent</p>
      </div>

      {/* Podsumowanie kosztów — 3 waluty */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Koszt / min</span>
          <span className="text-[10px] text-zinc-400">USD</span>
          <span className="text-[10px] text-zinc-400">EUR</span>
          <span className="text-[10px] text-zinc-400">PLN</span>
        </div>
        <div className="space-y-1.5">
          {fmtCurrRow("ElevenLabs", elevenlabsPerMinUSD)}
          {fmtCurrRow("OpenRouter", orCostPerMinUSD)}
          {fmtCurrRow("Twilio łącznie", twilioPerMinUSD)}
          {fmtCurrRow("SMS (amortyzacja)", smsCostPerMinUSD)}
          <div className="border-t border-zinc-200 pt-1.5 mt-1.5">
            {fmtCurrRow("ŁĄCZNIE", totalCostPerMinUSD)}
          </div>
        </div>
      </div>

      {/* Tabela planów */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white text-left">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Cena/mc PLN</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">EUR</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">USD</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Limit min</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Przych./min PLN</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Koszt/min</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Zysk/mc PLN</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Marża</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Próg rent.</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map(plan => {
                const discountedPrice = plan.pricePLN * (1 - discount / 100);
                const discountedPriceUSD = discountedPrice / usdPlnRate;
                const revenuePerMin = discountedPrice / plan.includedMinutes;
                const profitPerMin = revenuePerMin - totalCostPerMinPLN;
                const profitPerMonth = discountedPrice - (totalCostPerMinPLN * plan.includedMinutes);
                const marginPct = revenuePerMin > 0 ? (profitPerMin / revenuePerMin) * 100 : 0;
                const breakEven = totalCostPerMinPLN > 0 ? Math.ceil(discountedPrice / totalCostPerMinPLN) : 0;
                const isProfitable = profitPerMonth >= 0;

                return (
                  <tr key={plan.key} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{plan.label}</td>
                    <td className="px-4 py-3 font-mono">{plan.pricePLN.toFixed(0)} zł</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">€{(plan.pricePLN / usdPlnRate * eurUsdRate).toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">${(plan.pricePLN / usdPlnRate).toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono">{plan.includedMinutes}</td>
                    <td className="px-4 py-3 font-mono">{revenuePerMin.toFixed(4)} zł</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{fmtUSD(totalCostPerMinUSD)} / {fmtEUR(totalCostPerMinUSD)} / {fmtPLN(totalCostPerMinUSD)}</td>
                    <td className={`px-4 py-3 font-mono font-semibold ${isProfitable ? "text-brand-400" : "text-red-500"}`}>
                      {profitPerMonth.toFixed(2)} zł
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${marginPct > 20 ? "bg-brand-100 text-brand-500" : marginPct > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                        {marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{breakEven} min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-white border-t border-zinc-100 text-[10px] text-zinc-400">
          Kurs: 1 USD = {usdPlnRate.toFixed(2)} PLN · 1 EUR = {eurUsdRate.toFixed(2)} USD
        </div>
      </div>

      {/* Symulacja skali */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Symulacja przy skali</h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-xs text-zinc-500">Liczba firm:</label>
          <input type="range" min="10" max="500" step="10" value={scale} onChange={e => setScale(parseInt(e.target.value))} className="flex-1 accent-brand-400" />
          <span className="text-lg font-bold text-zinc-900 min-w-[3rem] text-right">{scale}</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const discountedPrice = plan.pricePLN * (1 - discount / 100);
            const discountedPriceUSD = discountedPrice / usdPlnRate;
            const revenue = scale * discountedPrice;
            const minutes = scale * plan.includedMinutes;
            const cost = minutes * totalCostPerMinPLN;
            const profit = revenue - cost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const profitUSD = profit / usdPlnRate;
            const profitEUR = profitUSD * eurUsdRate;
            return (
              <div key={plan.key} className={`border rounded-lg p-4 ${plan.hot ? "border-brand-400 bg-brand-50/50" : "border-zinc-100"}`}>
                <p className="text-sm font-semibold text-zinc-900">{plan.label}</p>
                <p className="text-2xl font-bold text-zinc-900">{profit.toFixed(0)} zł</p>
                <p className="text-xs text-zinc-400">€{profitEUR.toFixed(0)} · ${profitUSD.toFixed(0)}</p>
                <p className="text-xs text-zinc-500">Przychód: {revenue.toFixed(0)} zł</p>
                <p className="text-xs text-zinc-500">Koszt: {cost.toFixed(0)} zł</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${margin > 20 ? "bg-brand-100 text-brand-500" : margin > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                  {margin.toFixed(1)}% marży
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tiered elastic pricing table */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Cennik progresywny (suwak) — marże</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-200">
                <th className="pb-2 pr-3">Próg</th>
                <th className="pb-2 pr-3 text-right">PLN/min</th>
                <th className="pb-2 pr-3 text-right">Miesięcznie netto</th>
                <th className="pb-2 pr-3 text-right">Nasz koszt</th>
                <th className="pb-2 pr-3 text-right">Zysk/mies</th>
                <th className="pb-2 pr-3 text-right">Zysk/min</th>
                <th className="pb-2 text-right">Marża</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: JSX.Element[] = [];
                rows.push(
                  <tr key="0-50" className="border-b border-zinc-100">
                    <td className="py-2 pr-3 font-semibold text-zinc-700">0–50</td>
                    {(() => { const p = calculateElasticPrice(50); return (
                      <><td className="py-2 pr-3 text-right font-mono">{p.ratePerMin.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono">{p.monthlyNetto.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-zinc-500">{p.costTotal.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-green-600">{p.profitTotal.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-green-600">{p.profitPerMin.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 text-right"><span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-xs font-medium">{p.marginPercent}%</span></td></>
                    )})()}
                  </tr>
                );
                for (const t of ELASTIC_TIERS) {
                  if (t.minMinutes === 0) continue;
                  const p = calculateElasticPrice(t.maxMinutes);
                  rows.push(
                    <tr key={t.minMinutes} className="border-b border-zinc-100">
                      <td className="py-2 pr-3 font-semibold text-zinc-700">{t.minMinutes}–{t.maxMinutes}</td>
                      <td className="py-2 pr-3 text-right font-mono">{p.ratePerMin.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono">{p.monthlyNetto.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-zinc-500">{p.costTotal.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-green-600">{p.profitTotal.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 pr-3 text-right font-mono text-green-600">{p.profitPerMin.toFixed(2).replace(".",",")} zł</td>
                      <td className="py-2 text-right"><span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-xs font-medium">{p.marginPercent}%</span></td>
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-400 mt-3">Koszt wewnętrzny: {INTERNAL_COST_PER_MIN.toFixed(2).replace(".",",")} PLN/min. Marża liczona od ceny netto.</p>
      </div>

      {/* Stawki - info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Źródła stawek</h2>
        <div className="space-y-2 text-sm text-zinc-600">
          <p><strong>ElevenLabs ConvAI:</strong> $0.08/min (Interactive Voice AI) — <a href="https://elevenlabs.io/pricing" target="_blank" className="text-brand-400 underline" rel="noreferrer">elevenlabs.io/pricing</a></p>
          <p><strong>OpenRouter Qwen 3.5 35B:</strong> input ~$0.15/1M tok, output ~$1.00/1M tok — <a href="https://openrouter.ai/models/qwen/qwen3.6-35b-a3b" target="_blank" className="text-brand-400 underline" rel="noreferrer">openrouter.ai</a></p>
          <p><strong>Twilio SIP:</strong> $0.014/min (Polska) + ~$1.15/mc za numer — <a href="https://www.twilio.com/voice/pricing/pl" target="_blank" className="text-brand-400 underline" rel="noreferrer">twilio.com</a></p>
          <p><strong>Twilio SMS:</strong> ~$0.0779/sms (Polska) — <a href="https://www.twilio.com/sms/pricing/pl" target="_blank" className="text-brand-400 underline" rel="noreferrer">twilio.com</a>. Doliczany proporcjonalnie do kosztu/min dla % rozmów kończących się SMS-em.</p>
          <p className="text-xs text-zinc-400 mt-2">Stawki zmieniają się okresowo. Wpisz aktualne wartości ręcznie lub edytuj domyślne w komponencie.</p>
        </div>
      </div>
    </div>
  );
}
