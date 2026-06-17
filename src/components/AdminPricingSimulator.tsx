"use client";

import { useState, useEffect, type JSX } from "react";

interface PricingValues {
  internalCostPerMin: number;
  elasticBaseRate: number;
  elasticStepDecrease: number;
  elasticMinRate: number;
  elasticTierStep: number;
  elasticStartMin: number;
  elasticMaxMin: number;
  planStart: number;
  planGrowth: number;
  planPro: number;
  planLux: number;
  planEnterprise: number;
  addonOwnNumber: number;
  addonGoogleCalendar: number;
  addonCrm: number;
  addonVoiceClone: number;
  addonUnlimitedConsultants: number;
  addonPrioritySupport: number;
  addonSla247: number;
  enterpriseSetupFee: number;
  enterpriseMinMonthly: number;
  minMarginPercent: number;
  overageMultiplier: number;
}

const DEFAULTS: PricingValues = {
  internalCostPerMin: 0.65,
  elasticBaseRate: 2.00,
  elasticStepDecrease: 0.10,
  elasticMinRate: 1.00,
  elasticTierStep: 500,
  elasticStartMin: 50,
  elasticMaxMin: 5000,
  planStart: 299,
  planGrowth: 600,
  planPro: 300,
  planLux: 800,
  planEnterprise: 1500,
  addonOwnNumber: 49,
  addonGoogleCalendar: 39,
  addonCrm: 79,
  addonVoiceClone: 99,
  addonUnlimitedConsultants: 149,
  addonPrioritySupport: 59,
  addonSla247: 199,
  enterpriseSetupFee: 299,
  enterpriseMinMonthly: 1500,
  minMarginPercent: 35,
  overageMultiplier: 1.0,
};

function fmt(n: number): string { return n.toFixed(2).replace(".", ","); }
function fmtPl(n: number): string { return n.toFixed(2).replace(".", ",") + " zł"; }

interface SliderProp {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, suffix, onChange }: SliderProp) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono font-semibold text-zinc-800">{value.toFixed(step < 1 ? 2 : 0)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-brand-100 rounded-full appearance-none cursor-pointer accent-brand-400" />
    </div>
  );
}

function buildTiers(v: PricingValues): { min: number; max: number; rate: number; monthly: number; cost: number; profit: number; margin: number }[] {
  const tiers: { min: number; max: number; rate: number; monthly: number; cost: number; profit: number; margin: number }[] = [];
  let currentMin = 0;
  let currentRate = v.elasticBaseRate;
  const step = v.elasticTierStep;

  // Entry tier: 0 to elasticStartMin
  tiers.push({
    min: 0, max: v.elasticStartMin,
    rate: currentRate,
    monthly: v.elasticStartMin * currentRate,
    cost: v.elasticStartMin * v.internalCostPerMin,
    profit: (currentRate - v.internalCostPerMin) * v.elasticStartMin,
    margin: Math.round(((currentRate - v.internalCostPerMin) / currentRate) * 100),
  });

  currentMin = v.elasticStartMin;

  while (currentMin < v.elasticMaxMin) {
    const nextMax = Math.min(currentMin + step, v.elasticMaxMin);
    const rate = Math.max(v.elasticMinRate, currentRate - v.elasticStepDecrease);
    tiers.push({
      min: currentMin + 1, max: nextMax,
      rate,
      monthly: nextMax * rate,
      cost: nextMax * v.internalCostPerMin,
      profit: (rate - v.internalCostPerMin) * nextMax,
      margin: Math.round(((rate - v.internalCostPerMin) / rate) * 100),
    });
    currentMin = nextMax;
    currentRate = rate;
  }

  return tiers;
}

export default function AdminPricingSimulator() {
  const [tab, setTab] = useState<"simulator" | "overrides" | "configs">("simulator");
  const [vals, setVals] = useState<PricingValues>(DEFAULTS);
  const [configs, setConfigs] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [overrideBizId, setOverrideBizId] = useState("");
  const [overrideDiscount, setOverrideDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [configRes, overridesRes] = await Promise.all([
        fetch("/api/admin/pricing-config"),
        fetch("/api/admin/pricing-config/business-overrides"),
      ]);
      const configData = await configRes.json();
      setConfigs(configData.configs || []);
      const active = configData.active;
      if (active) {
        setActiveId(active.id);
        setVals(prev => ({ ...prev, ...(active.config as Partial<PricingValues>) }));
      }
      const overridesData = await overridesRes.json();
      setOverrides(overridesData || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function update<K extends keyof PricingValues>(key: K, val: number) {
    setVals(prev => ({ ...prev, [key]: val }));
  }

  const tiers = buildTiers(vals);

  function planMargin(price: number, includedMin: number): number {
    const revPerMin = price / includedMin;
    return Math.round(((revPerMin - vals.internalCostPerMin) / revPerMin) * 100);
  }

  function formatMargin(m: number): string {
    if (m >= vals.minMarginPercent) return `${m}% ✅`;
    if (m > 0) return `${m}% ⚠️`;
    return `${m}% ❌`;
  }

  async function handleSave() {
    if (!saveName.trim()) { setToast("Podaj nazwę konfiguracji"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName, config: vals, setActive: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast(`Zapisano "${saveName}" jako aktywny`);
        setSaveName("");
        loadAll();
      } else {
        setToast("Błąd: " + (data.error || "unknown"));
      }
    } catch (e: any) {
      setToast("Błąd: " + e.message);
    }
    setSaving(false);
  }

  async function handleSetActive(id: string) {
    const res = await fetch("/api/admin/pricing-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, setActive: true }),
    });
    const data = await res.json();
    if (data.ok) { setToast("Aktywowano"); loadAll(); }
  }

  async function handleSaveOverride() {
    if (!overrideBizId) return;
    const overridesObj: Record<string, number> = {};
    if (overrideDiscount > 0) overridesObj.discountPercent = overrideDiscount;
    const res = await fetch("/api/admin/pricing-config/business-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: overrideBizId, overrides: overridesObj }),
    });
    const data = await res.json();
    if (data.ok) { setToast("Zapisano override"); loadAll(); }
  }

  async function handleDeleteOverride(businessId: string) {
    await fetch(`/api/admin/pricing-config/business-overrides?businessId=${businessId}`, { method: "DELETE" });
    setToast("Usunięto override"); loadAll();
  }

  if (loading) return <div className="text-sm text-zinc-400 p-8 text-center">Ładowanie konfiguracji cen...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {(["simulator", "overrides", "configs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-brand-400 text-white shadow-sm" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-brand-50"}`}>
            {t === "simulator" ? "Symulator" : t === "overrides" ? "Override firm" : "Zapisane konfiguracje"}
          </button>
        ))}
      </div>

      {toast && <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-2 rounded-xl">{toast}</div>}

      {tab === "simulator" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900">Koszty wewnętrzne i marża</h3>
              <Slider label="Koszt wewnętrzny / min" value={vals.internalCostPerMin} min={0.30} max={1.50} step={0.01} suffix=" zł" onChange={v => update("internalCostPerMin", v)} />
              <Slider label="Min. marża docelowa" value={vals.minMarginPercent} min={0} max={80} step={1} suffix="%" onChange={v => update("minMarginPercent", v)} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900">Cennik progresywny (suwak)</h3>
              <Slider label="Stawka bazowa (50 min)" value={vals.elasticBaseRate} min={0.50} max={5.00} step={0.05} suffix=" zł" onChange={v => update("elasticBaseRate", v)} />
              <Slider label="Spadek stawki / próg" value={vals.elasticStepDecrease} min={0.01} max={0.50} step={0.01} suffix=" zł" onChange={v => update("elasticStepDecrease", v)} />
              <Slider label="Stawka minimalna" value={vals.elasticMinRate} min={0.30} max={3.00} step={0.05} suffix=" zł" onChange={v => update("elasticMinRate", v)} />
              <Slider label="Krok progów (min)" value={vals.elasticTierStep} min={100} max={1000} step={50} suffix="" onChange={v => update("elasticTierStep", v)} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900">Plany abonamentowe (ceny netto)</h3>
              <Slider label="START (250 min)" value={vals.planStart} min={99} max={999} step={10} suffix=" zł" onChange={v => update("planStart", v)} />
              <Slider label="GROWTH (600 min)" value={vals.planGrowth} min={199} max={1999} step={10} suffix=" zł" onChange={v => update("planGrowth", v)} />
              <Slider label="PRO (300 min)" value={vals.planPro} min={99} max={999} step={10} suffix=" zł" onChange={v => update("planPro", v)} />
              <Slider label="LUX (800 min)" value={vals.planLux} min={199} max={1999} step={10} suffix=" zł" onChange={v => update("planLux", v)} />
              <Slider label="ENTERPRISE (1500 min)" value={vals.planEnterprise} min={499} max={4999} step={50} suffix=" zł" onChange={v => update("planEnterprise", v)} />
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900">Dodatki i enterprise</h3>
              <Slider label="Własny numer +48" value={vals.addonOwnNumber} min={0} max={199} step={5} suffix=" zł" onChange={v => update("addonOwnNumber", v)} />
              <Slider label="Google Calendar" value={vals.addonGoogleCalendar} min={0} max={199} step={5} suffix=" zł" onChange={v => update("addonGoogleCalendar", v)} />
              <Slider label="Integracja CRM" value={vals.addonCrm} min={0} max={299} step={5} suffix=" zł" onChange={v => update("addonCrm", v)} />
              <Slider label="Klon głosu" value={vals.addonVoiceClone} min={0} max={299} step={5} suffix=" zł" onChange={v => update("addonVoiceClone", v)} />
              <Slider label="Nielimitowani konsultanci" value={vals.addonUnlimitedConsultants} min={0} max={399} step={10} suffix=" zł" onChange={v => update("addonUnlimitedConsultants", v)} />
              <Slider label="Enterprise setup fee" value={vals.enterpriseSetupFee} min={0} max={999} step={50} suffix=" zł" onChange={v => update("enterpriseSetupFee", v)} />
              <Slider label="Enterprise minimum/mc" value={vals.enterpriseMinMonthly} min={499} max={4999} step={100} suffix=" zł" onChange={v => update("enterpriseMinMonthly", v)} />
            </div>

            {/* Save */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Zapisz konfigurację</h3>
              <input value={saveName} onChange={e => setSaveName(e.target.value)}
                placeholder="Np. Cennik lipiec 2026"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-brand-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-500 transition disabled:opacity-50">
                {saving ? "Zapisywanie..." : "Zapisz i aktywuj"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3 space-y-4">
            {/* Plans preview */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Podgląd — plany abonamentowe</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                      <th className="text-left pb-2 pr-2">Plan</th>
                      <th className="text-right pb-2 pr-2">Cena/mc</th>
                      <th className="text-right pb-2 pr-2">Limit min</th>
                      <th className="text-right pb-2 pr-2">PLN/min</th>
                      <th className="text-right pb-2 pr-2">Nasz koszt</th>
                      <th className="text-right pb-2 pr-2">Zysk/min</th>
                      <th className="text-right pb-2">Marża</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "START", price: vals.planStart, min: 250 },
                      { name: "GROWTH", price: vals.planGrowth, min: 600, hot: true },
                      { name: "PRO", price: vals.planPro, min: 300 },
                      { name: "LUX", price: vals.planLux, min: 800 },
                      { name: "ENTERPRISE", price: vals.planEnterprise, min: 1500 },
                    ].map(p => {
                      const rpm = p.price / p.min;
                      const cost = p.min * vals.internalCostPerMin;
                      const zysk = p.price - cost;
                      const zyskMin = rpm - vals.internalCostPerMin;
                      const marg = Math.round((zyskMin / rpm) * 100);
                      return (
                        <tr key={p.name} className={`border-b border-zinc-100 ${(p as any).hot ? "bg-brand-50/50" : ""}`}>
                          <td className="py-1.5 pr-2 font-semibold text-zinc-700">{p.name}</td>
                          <td className="py-1.5 pr-2 text-right font-mono">{fmtPl(p.price)}</td>
                          <td className="py-1.5 pr-2 text-right font-mono">{p.min}</td>
                          <td className="py-1.5 pr-2 text-right font-mono">{fmt(rpm)}</td>
                          <td className="py-1.5 pr-2 text-right font-mono text-zinc-500">{fmtPl(cost)}</td>
                          <td className="py-1.5 pr-2 text-right font-mono text-green-600">{fmt(zyskMin)}</td>
                          <td className="py-1.5 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${marg >= vals.minMarginPercent ? "bg-green-100 text-green-700" : marg > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{formatMargin(marg)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Elastic tiers preview */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Podgląd — cennik progresywny</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                      <th className="text-left pb-2 pr-2">Próg</th>
                      <th className="text-right pb-2 pr-2">PLN/min</th>
                      <th className="text-right pb-2 pr-2">Miesięcznie</th>
                      <th className="text-right pb-2 pr-2">Nasz koszt</th>
                      <th className="text-right pb-2 pr-2">Zysk/mc</th>
                      <th className="text-right pb-2 pr-2">Zysk/min</th>
                      <th className="text-right pb-2">Marża</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t, i) => (
                      <tr key={i} className="border-b border-zinc-100">
                        <td className="py-1.5 pr-2 font-semibold text-zinc-700">{t.min}–{t.max}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">{fmt(t.rate)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono text-zinc-800">{fmtPl(t.monthly)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono text-zinc-500">{fmtPl(t.cost)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono text-green-600">{fmtPl(t.profit)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono text-green-600">{fmt(t.rate - vals.internalCostPerMin)}</td>
                        <td className="py-1.5 text-right">{(() => {
                          const m = t.margin;
                          return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m >= vals.minMarginPercent ? "bg-green-100 text-green-700" : m > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{formatMargin(m)}</span>;
                        })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2">Koszt wewnętrzny: {fmt(vals.internalCostPerMin)} PLN/min. Minimalna marża: {vals.minMarginPercent}%.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "overrides" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Nowy override</h3>
            <input value={overrideBizId} onChange={e => setOverrideBizId(e.target.value)}
              placeholder="ID firmy (UUID)"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <Slider label="Rabat %" value={overrideDiscount} min={0} max={50} step={1} suffix="%" onChange={setOverrideDiscount} />
            <button onClick={handleSaveOverride} className="w-full bg-brand-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-500 transition">Zapisz override</button>
          </div>
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Aktywne override'y</h3>
            {overrides.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">Brak override'ów</p>
            ) : (
              <div className="space-y-2">
                {overrides.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3 bg-zinc-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{o.businesses?.name || o.business_id}</p>
                      <p className="text-xs text-zinc-400">{JSON.stringify(o.overrides)}</p>
                    </div>
                    <button onClick={() => handleDeleteOverride(o.business_id)} className="text-xs text-red-500 hover:text-red-600 transition">Usuń</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "configs" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Zapisane konfiguracje</h3>
          {configs.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Brak zapisanych konfiguracji</p>
          ) : (
            <div className="space-y-2">
              {configs.map((c: any) => (
                <div key={c.id} className={`flex items-center justify-between px-4 py-3 rounded-lg ${c.is_active ? "bg-brand-50 border border-brand-200" : "bg-zinc-50"}`}>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{c.name}</p>
                    <p className="text-xs text-zinc-400">{new Date(c.created_at).toLocaleString("pl-PL")}{c.is_active ? " · aktywna" : ""}</p>
                  </div>
                  {!c.is_active && (
                    <button onClick={() => handleSetActive(c.id)} className="text-xs text-brand-500 hover:text-brand-600 transition">Aktywuj</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
