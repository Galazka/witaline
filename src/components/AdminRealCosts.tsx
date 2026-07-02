"use client";

import { useState, useEffect, useCallback } from "react";
import { getExchangeRates, convertToPln, type Rates } from "@/lib/exchange-rates";

/* ── Types ── */

interface BizCost {
  id: string;
  name: string;
  plan: string;
  is_centrala?: boolean;
  calls: number;
  minutes: number;
  costElevenlabs: number;
  costTwilio: number;
  costOpenrouter: number;
  costSms: number;
  totalCost: number;
  revenue: number;
  customRevenue: number | null;
  prevTotalCost: number | null;
  prevRevenue: number | null;
  prevCalls: number | null;
}

interface CostItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  due_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

interface OwnCostsSummary {
  monthly_total: number;
  unpaid_total: number;
  unpaid_count: number;
  total_items: number;
  by_category: Record<string, { count: number; total: number; monthly: number }>;
}

type ViewCurrency = "PLN" | "EUR" | "USD";

type DayGroup = {
  date: string;
  businesses: Map<string, {
    bizId: string;
    name: string;
    plan: string;
    is_centrala: boolean;
    calls: Array<{
      id: string;
      from_number: string;
      duration_seconds: number;
      cost_elevenlabs: number;
      cost_twilio: number;
      cost_openrouter: number;
      created_at: string;
    }>;
    totalCalls: number;
    totalMinutes: number;
    totalCostElevenlabs: number;
    totalCostTwilio: number;
    totalCostOpenrouter: number;
    totalCost: number;
    totalRevenue: number;
  }>;
};

/* ── Helpers ── */

function fmtPLN(v: number): string {
  const abs = Math.abs(v);
  const s = abs.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-${s} zl` : `${s} zl`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function firstOfPrevMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function csvEscape(val: string | number): string {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

import { plans as pricingPlans, getPlanConfig } from "@/lib/pricing";

function getPlanLabel(planKey: string): string {
  if (planKey === "elastic_0") return "Elastyczny";
  if (planKey === "self_service") return "Self-Service";
  const cfg = getPlanConfig(planKey);
  const price = cfg?.price ?? 199;
  return `${cfg?.label || planKey} ${price} PLN`;
}

function getPlanRevenue(planKey: string): number {
  if (planKey === "elastic_0" || planKey === "self_service") return 0;
  const cfg = getPlanConfig(planKey);
  return cfg?.price ?? 199;
}

function freqLabel(f: string): string {
  const m: Record<string, string> = { monthly: "mies.", quarterly: "kwart.", yearly: "rocznie", "one-time": "jednor.", irregular: "niereg." };
  return m[f] || f;
}

/* ── Component ── */

export default function AdminRealCosts() {
  const [data, setData] = useState<BizCost[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [ownCostsSummary, setOwnCostsSummary] = useState<OwnCostsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDiscount, setSavingDiscount] = useState<string | null>(null);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [search, setSearch] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string>("all");
  const [expandedBiz, setExpandedBiz] = useState<string | null>(null);
  const [showOwnCosts, setShowOwnCosts] = useState(true);
  const [showCallCosts, setShowCallCosts] = useState(true);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [comparePrev, setComparePrev] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [editItem, setEditItem] = useState<CostItem | null>(null);
  const [currency, setCurrency] = useState<ViewCurrency>("USD");
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesDate, setRatesDate] = useState<string>("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", amount: 0, frequency: "monthly", category: "other", due_date: "", is_paid: false, notes: "" });
  const [callLogs, setCallLogs] = useState<Array<{ id: string; business_id: string; duration_seconds: number; cost_pln: number; cost_elevenlabs: number; cost_twilio: number; cost_openrouter: number; total_cost: number; revenue_pln: number; from_number: string; created_at: string; business_name: string }>>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedBizDay, setExpandedBizDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getExchangeRates().then((r) => {
      if (cancelled) return;
      setRates(r);
      const d = new Date(r.fetchedAt);
      setRatesDate(d.toLocaleDateString("pl-PL"));
    });
    return () => { cancelled = true; };
  }, []);

  // All cost values from API are in USD
  const fmt = (valueInUsd: number): string => {
    if (currency === "USD") {
      const isNeg = valueInUsd < 0;
      const s = Math.abs(valueInUsd).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return isNeg ? `-${s} $` : `${s} $`;
    }
    const inPln = convertToPln(valueInUsd, "USD", rates || undefined);
    if (currency === "PLN") {
      const s = inPln.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${valueInUsd < 0 ? "-" : ""}${s} zł`;
    }
    const r = rates || { usdPln: 4.15, eurPln: 4.52 };
    const inEur = Math.round((inPln / r.eurPln) * 100) / 100;
    return `${inEur.toFixed(2).replace(".", ",")} €`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/real-costs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&includePrev=${comparePrev}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.businesses || []);
        setOwnCostsSummary(json.own_costs || null);
        setCostItems(json.cost_items || []);
        setCallLogs(json.call_logs || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [from, to, comparePrev]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = selectedBiz !== "all"
    ? data.filter((b) => b.id === selectedBiz)
    : search.trim()
      ? data.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      : data;

  /* ── KPI summaries ── */
  const totalCost = filtered.reduce((a, b) => a + b.totalCost, 0);
  const centralaCost = filtered.filter(b => b.is_centrala).reduce((a, b) => a + b.totalCost, 0);
  const clientCost = totalCost - centralaCost;
  const totalRevenue = filtered.filter(b => !b.is_centrala).reduce((a, b) => a + (b.customRevenue ?? b.revenue), 0);
  const totalOwnCosts = ownCostsSummary?.monthly_total || 0;
  const totalAllCosts = totalCost + totalOwnCosts;
  const totalMargin = totalRevenue - totalAllCosts;
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const totalCalls = filtered.reduce((s, b) => s + b.calls, 0);

  const unprofitable = filtered.filter((b) => {
    if (b.is_centrala) return false;
    const rev = b.customRevenue ?? b.revenue;
    return rev - b.totalCost < 0;
  }).length;

  // Build day groups from call logs
  const dayGroups: DayGroup[] = [];
  const dayMap = new Map<string, DayGroup>();
  for (const log of callLogs) {
    const day = log.created_at?.slice(0, 10) || "nieznany";
    if (!dayMap.has(day)) {
      dayMap.set(day, { date: day, businesses: new Map() });
      dayGroups.push(dayMap.get(day)!);
    }
    const dg = dayMap.get(day)!;
    const bizId = log.business_id || "unknown";
    if (!dg.businesses.has(bizId)) {
      const bizInfo = data.find(b => b.id === bizId);
      dg.businesses.set(bizId, {
        bizId,
        name: bizInfo?.name || log.business_name || "Nieznana",
        plan: bizInfo?.plan || "elastic_0",
        is_centrala: bizInfo?.is_centrala || false,
        calls: [],
        totalCalls: 0,
        totalMinutes: 0,
        totalCostElevenlabs: 0,
        totalCostTwilio: 0,
        totalCostOpenrouter: 0,
        totalCost: 0,
        totalRevenue: 0,
      });
    }
    const bd = dg.businesses.get(bizId)!;
    bd.calls.push({
      id: log.id,
      from_number: log.from_number || "",
      duration_seconds: log.duration_seconds || 0,
      cost_elevenlabs: Number(log.cost_elevenlabs) || 0,
      cost_twilio: Number(log.cost_twilio) || 0,
      cost_openrouter: Number(log.cost_openrouter) || 0,
      created_at: log.created_at,
    });
    bd.totalCalls++;
    bd.totalMinutes += (log.duration_seconds || 0) / 60;
    bd.totalCostElevenlabs += Number(log.cost_elevenlabs) || 0;
    bd.totalCostTwilio += Number(log.cost_twilio) || 0;
    bd.totalCostOpenrouter += Number(log.cost_openrouter) || 0;
    bd.totalCost += Math.round(((Number(log.cost_elevenlabs) || 0) + (Number(log.cost_twilio) || 0) + (Number(log.cost_openrouter) || 0)) * 100) / 100;
    bd.totalRevenue += Number(log.revenue_pln) || 0;
  }
  dayGroups.sort((a, b) => b.date.localeCompare(a.date));

  const atRisk = filtered.filter((b) => {
    if (b.is_centrala) return false;
    const rev = b.customRevenue ?? b.revenue;
    const margin = rev - b.totalCost;
    const pct = rev > 0 ? (margin / rev) * 100 : 0;
    return pct >= 0 && pct < 15;
  }).length;

  const prevTotalCalls = filtered.reduce((s, b) => s + (b.prevCalls || 0), 0);
  const prevTotalCost_ = filtered.reduce((s, b) => s + (b.prevTotalCost || 0), 0);

  /* ── Cost items ── */
  const unpaidItems = costItems.filter((i) => !i.is_paid);
  const upcomingItems = costItems
    .filter((i) => !i.is_paid && i.due_date)
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  async function saveCostItem(item: typeof newItem) {
    await fetch("/api/admin/cost-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setShowAddItem(false);
    setNewItem({ name: "", amount: 0, frequency: "monthly", category: "other", due_date: "", is_paid: false, notes: "" });
    fetchData();
  }

  async function togglePaid(id: string, isPaid: boolean) {
    await fetch("/api/admin/cost-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_paid: isPaid, paid_at: isPaid ? todayStr() : null }),
    });
    fetchData();
  }

  async function deleteCostItem(id: string) {
    await fetch("/api/admin/cost-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  function exportCsv() {
    const rows = [
      ["Firma", "Plan", "Rozmowy", "Minuty", "ElevenLabs", "Twilio", "OpenRouter", "SMS",
       "Koszt", "Przychod", "Rabat %", "Przychod efektywny", "Marza", "Marza %"],
      ...filtered.map((b) => {
        const stdRevenue = getPlanRevenue(b.plan);
        const effectiveRevenue = b.customRevenue ?? b.revenue;
        const discountPct = b.customRevenue !== null ? ((1 - b.customRevenue / stdRevenue) * 100).toFixed(1) : "0.0";
        const margin = effectiveRevenue - b.totalCost;
        const marginPctVal = effectiveRevenue > 0 ? ((margin / effectiveRevenue) * 100).toFixed(1) : "0.0";
        return [
          b.name, getPlanLabel(b.plan), String(b.calls), b.minutes.toFixed(2),
          b.costElevenlabs.toFixed(2), b.costTwilio.toFixed(2), b.costOpenrouter.toFixed(2),
          b.costSms.toFixed(2), b.totalCost.toFixed(2), stdRevenue.toFixed(2),
          discountPct, effectiveRevenue.toFixed(2), margin.toFixed(2), marginPctVal,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `witaline-finanse-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDiscountChange(bizId: string, newRevenue: number) {
    setSavingDiscount(bizId);
    try {
      await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bizId, custom_monthly_revenue: newRevenue }),
      });
      fetchData();
    } catch { /* ignore */ }
    setSavingDiscount(null);
  }

  return (
    <div className="space-y-6">
      {/* ── Header filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Od:</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 dark:bg-brand-800 focus:outline-none focus:border-[#0d9488]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Do:</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-2 py-1.5 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 dark:bg-brand-800 focus:outline-none focus:border-[#0d9488]" />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as ViewCurrency)}
            className="px-2 py-1.5 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 bg-white dark:bg-brand-800 focus:outline-none focus:border-[#0d9488]"
            title="Wyświetl w">
            <option value="PLN">PLN (zł)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
          {rates && (
            <span className="text-[10px] text-zinc-400" title={`Kurs NBP z ${ratesDate}`}>
              1€ = {rates.eurPln.toFixed(2)} zł | 1$ = {rates.usdPln.toFixed(2)} zł
            </span>
          )}
          <button onClick={fetchData}
            className="px-3 py-1.5 text-xs font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition">
            Odswiez
          </button>
          <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
            <input type="checkbox" checked={comparePrev} onChange={() => setComparePrev(!comparePrev)}
              className="rounded border-zinc-300 text-[#0d9488] focus:ring-[#0d9488]/20" />
            Porownaj z poprzednim okresem
          </label>
          <button
            onClick={async () => {
              setSyncing(true); setSyncMsg("Synchronizowanie...");
              try { const r = await fetch("/api/admin/sync-costs", { method: "POST" }); const d = await r.json(); setSyncMsg(d.message || "OK"); fetchData(); } catch { setSyncMsg("Blad synchronizacji"); }
              setSyncing(false); setTimeout(() => setSyncMsg(""), 5000);
            }}
            disabled={syncing}
            className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
          >
            {syncing ? "Sync..." : "Sync koszty"}
          </button>
          {syncMsg && <span className="text-xs text-zinc-500">{syncMsg}</span>}
          <button
            onClick={async () => {
              if (!confirm("CZY NA PEWNO? To usunie WSZYSTKIE dane testowe: call_logs, rozmowy, SMS, notyfikacje, leady. Tej operacji NIE MOZNA cofnac. Kontynuowac?")) return;
              if (!confirm("NAPRAWDE? Wszystkie statystyki zostana zresetowane do zera. To nie jest zabawa.")) return;
              try { const r = await fetch("/api/admin/reset-stats", { method: "POST" }); const d = await r.json(); alert(d.message || "OK"); if (r.ok) fetchData(); } catch { alert("Blad resetowania"); }
            }}
            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            title="Usuwa wszystkie dane testowe"
          >
            RESET
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedBiz} onChange={(e) => setSelectedBiz(e.target.value)}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-700 bg-white focus:outline-none focus:border-[#0d9488] min-w-[140px]">
            <option value="all">— Wszystkie firmy —</option>
            {data.map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_centrala ? " (Centrala)" : ""}</option>)}
          </select>
          <input type="text" placeholder="Szukaj firmy..." value={search} onChange={(e) => { setSearch(e.target.value); setSelectedBiz("all"); }}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-[#0d9488] w-48" />
          <button onClick={exportCsv}
            className="px-3 py-1.5 text-xs font-medium bg-brand-50 text-zinc-600 rounded-lg hover:bg-[#ccfbf1] transition">
            CSV
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Koszt uslug</p>
          <p className="text-xl font-bold text-red-500 mt-1">{fmt(totalCost)}</p>
          <p className="text-[10px] text-zinc-400">w tym centrala: {fmt(centralaCost)}</p>
          {comparePrev && prevTotalCost_ > 0 && (
            <p className={`text-[10px] mt-0.5 ${totalCost >= prevTotalCost_ ? "text-red-400" : "text-green-500"}`}>
              {totalCost >= prevTotalCost_ ? "+" : ""}{((totalCost - prevTotalCost_) / prevTotalCost_ * 100).toFixed(0)}% vs poprz.
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Koszty wlasne</p>
          <p className="text-xl font-bold text-amber-500 mt-1">{fmt(totalOwnCosts)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{ownCostsSummary?.total_items || 0} pozycji</p>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Lacznie koszty</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(totalAllCosts)}</p>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Przychod</p>
          <p className="text-xl font-bold text-[#0d9488] mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Marza</p>
          <p className={`text-xl font-bold mt-1 ${totalMargin >= 0 ? "text-green-600" : "text-red-500"}`}>
            {totalMargin >= 0 ? "+" : ""}{fmt(totalMargin)}
          </p>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Marza %</p>
          <p className={`text-xl font-bold mt-1 ${marginPct >= 20 ? "text-green-600" : marginPct >= 0 ? "text-amber-600" : "text-red-500"}`}>
            {marginPct.toFixed(1)}%
          </p>
          <div className="mt-2 h-1.5 bg-brand-50 dark:bg-brand-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${marginPct >= 20 ? "bg-green-500" : marginPct >= 0 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, Math.max(0, marginPct * 2))}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Firmy na minusie</p>
          <p className={`text-xl font-bold mt-1 ${unprofitable > 0 ? "text-red-500" : "text-green-600"}`}>{unprofitable}</p>
          <p className="text-xs text-zinc-400 mt-0.5">z {filtered.length} firm</p>
        </div>
        <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Rozmowy</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{totalCalls}</p>
          {comparePrev && (
            <p className={`text-[10px] mt-0.5 ${totalCalls >= prevTotalCalls ? "text-green-500" : "text-red-400"}`}>
              {totalCalls >= prevTotalCalls ? "+" : ""}{totalCalls - prevTotalCalls} vs poprz.
            </p>
          )}
        </div>
      </div>

      {/* ── Koszty wg dni (day → business → calls) ── */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 overflow-hidden">
        <button
          onClick={() => setShowCallCosts(!showCallCosts)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-[#f0fdfa] dark:hover:bg-brand-800/30 transition"
        >
          <span className="flex items-center gap-2">
            <span>📞 Koszty wg dni</span>
            <span className="text-[10px] bg-[#ccfbf1] dark:bg-brand-800 text-[#065f46] dark:text-teal-300 rounded-full px-2 py-0.5 font-medium">
              {dayGroups.length} dni · {callLogs.length} rozmów
            </span>
          </span>
          <span className="text-zinc-300 dark:text-zinc-500">{showCallCosts ? "▲" : "▼"}</span>
        </button>
        {showCallCosts && (
          <div className="px-5 pb-4 space-y-2">
            {dayGroups.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">Brak rozmów w wybranym okresie</p>
            ) : (
              dayGroups.map(dg => {
                const dayTotalCost = [...dg.businesses.values()].reduce((s, b) => s + b.totalCost, 0);
                const dayTotalRevenue = [...dg.businesses.values()].reduce((s, b) => s + b.totalRevenue, 0);
                const dayTotalCalls = [...dg.businesses.values()].reduce((s, b) => s + b.totalCalls, 0);
                const dayTotalMinutes = [...dg.businesses.values()].reduce((s, b) => s + b.totalMinutes, 0);
                const dayProfit = dayTotalRevenue - dayTotalCost;
                const isExpanded = expandedDay === dg.date;
                return (
                  <div key={dg.date} className="border border-zinc-100 dark:border-brand-700 rounded-lg overflow-hidden">
                    {/* Day header */}
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : dg.date)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-brand-800/20 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] transition ${isExpanded ? "text-[#0d9488]" : "text-zinc-300 dark:text-zinc-500"}`}>{isExpanded ? "▼" : "▶"}</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                          {new Date(dg.date + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{dayTotalCalls} rozmów · {Math.round(dayTotalMinutes)} min</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-red-500">{fmt(dayTotalCost)}</span>
                        {dayTotalRevenue > 0 && <span className="text-xs font-medium text-[#0d9488]">{fmt(dayTotalRevenue)}</span>}
                        {dayTotalRevenue > 0 && (
                          <span className={`text-xs font-medium ${dayProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {dayProfit >= 0 ? "+" : ""}{fmt(dayProfit)}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Day expanded: businesses */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-brand-700 bg-zinc-50/50 dark:bg-brand-950/50">
                        {[...dg.businesses.values()].map(bd => {
                          const bizProfit = bd.totalRevenue - bd.totalCost;
                          const bizExpanded = expandedBizDay === `${dg.date}-${bd.bizId}`;
                          return (
                            <div key={bd.bizId}>
                              {/* Business row */}
                              <button
                                onClick={() => setExpandedBizDay(bizExpanded ? null : `${dg.date}-${bd.bizId}`)}
                                className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-white dark:hover:bg-brand-900/50 transition text-left border-b border-zinc-100 dark:border-brand-800 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] transition ${bizExpanded ? "text-[#0d9488]" : "text-zinc-300 dark:text-zinc-500"}`}>{bizExpanded ? "▼" : "▶"}</span>
                                  <span className="font-medium text-zinc-700 dark:text-zinc-300 text-xs">{bd.name}</span>
                                  {bd.is_centrala && <span className="text-[9px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full px-1.5 py-0.5 font-medium">Centrala</span>}
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{bd.totalCalls} rozmów · {Math.round(bd.totalMinutes * 10) / 10} min</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px]">
                                  <span className="text-zinc-500 dark:text-zinc-400">EL: <span className="font-medium text-zinc-700 dark:text-zinc-300">{fmt(bd.totalCostElevenlabs)}</span></span>
                                  <span className="text-zinc-500 dark:text-zinc-400">TW: <span className="font-medium text-zinc-700 dark:text-zinc-300">{fmt(bd.totalCostTwilio)}</span></span>
                                  <span className="font-medium text-red-500">{fmt(bd.totalCost)}</span>
                                  {bd.totalRevenue > 0 && <span className="font-medium text-[#0d9488]">{fmt(bd.totalRevenue)}</span>}
                                  {bd.totalRevenue > 0 && (
                                    <span className={`font-medium ${bizProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                                      {bizProfit >= 0 ? "+" : ""}{fmt(bizProfit)}
                                    </span>
                                  )}
                                </div>
                              </button>

                              {/* Business expanded: individual calls */}
                              {bizExpanded && (
                                <div className="bg-white dark:bg-brand-900 border-t border-zinc-100 dark:border-brand-800 px-6 py-2">
                                  {/* Summary bar */}
                                  <div className="flex items-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-500 mb-2 px-2">
                                    <span>Łącznie: {bd.totalCalls} rozmów, {Math.round(bd.totalMinutes * 10) / 10} min</span>
                                    <span>EL: {fmt(bd.totalCostElevenlabs)}</span>
                                    <span>TW: {fmt(bd.totalCostTwilio)}</span>
                                    <span>OR: {fmt(bd.totalCostOpenrouter)}</span>
                                    <span className="font-medium text-red-500">Koszt: {fmt(bd.totalCost)}</span>
                                    {bd.totalRevenue > 0 && <span className="font-medium text-[#0d9488]">Przychód: {fmt(bd.totalRevenue)}</span>}
                                    {bd.totalRevenue > 0 && <span className={`font-medium ${bizProfit >= 0 ? "text-green-600" : "text-red-500"}`}>Zysk: {bizProfit >= 0 ? "+" : ""}{fmt(bizProfit)}</span>}
                                  </div>
                                  {/* Call list */}
                                  <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {bd.calls.sort((a, c) => c.created_at?.localeCompare(a.created_at || "") || 0).map(c => (
                                      <div key={c.id} className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-zinc-50 dark:bg-brand-800/50 border border-zinc-100 dark:border-brand-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <span className="text-zinc-400 dark:text-zinc-500 w-24">{new Date(c.created_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                          <span className="text-zinc-500 dark:text-zinc-400 font-mono">{c.from_number || "—"}</span>
                                          <span className="text-zinc-400 dark:text-zinc-500">{c.duration_seconds >= 60 ? `${Math.round(c.duration_seconds / 60)} min` : `${c.duration_seconds} s`}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-zinc-500 dark:text-zinc-400">EL: {fmt(c.cost_elevenlabs)}</span>
                                          <span className="text-zinc-500 dark:text-zinc-400">TW: {fmt(c.cost_twilio)}</span>
                                          <span className="font-medium text-red-500">{fmt(c.cost_elevenlabs + c.cost_twilio + c.cost_openrouter)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Wlasne koszty / Cost items ── */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 overflow-hidden">
        <button
          onClick={() => setShowOwnCosts(!showOwnCosts)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-[#f0fdfa] dark:hover:bg-brand-800/30 transition"
        >
          <span className="flex items-center gap-2">
            <span>📊 Koszty wlasne</span>
            {unpaidItems.length > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-medium">
                {unpaidItems.length} niezaplacone
              </span>
            )}
          </span>
          <span className="text-zinc-300">{showOwnCosts ? "▲" : "▼"}</span>
        </button>
        {showOwnCosts && (
          <div className="px-5 pb-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
                <p className="text-xs text-zinc-400">Miesiecznie</p>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{fmt(ownCostsSummary?.monthly_total || 0)}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
                <p className="text-xs text-zinc-400">Niezaplacone</p>
                <p className="text-lg font-bold text-red-500">{fmt(ownCostsSummary?.unpaid_total || 0)}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
                <p className="text-xs text-zinc-400">Pozycji</p>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{ownCostsSummary?.total_items || 0}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
                <p className="text-xs text-zinc-400">Kategorii</p>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{ownCostsSummary ? Object.keys(ownCostsSummary.by_category).length : 0}</p>
              </div>
            </div>

            {/* By category */}
            {ownCostsSummary && Object.keys(ownCostsSummary.by_category).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(ownCostsSummary.by_category).map(([cat, info]) => (
                  <div key={cat} className="bg-brand-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="font-medium text-zinc-700 capitalize">{cat}</span>
                    <span className="text-zinc-400 ml-2">{fmt((info as any).monthly)}/mies</span>
                    <span className="text-zinc-300 ml-1">· {(info as any).count} szt.</span>
                  </div>
                ))}
              </div>
            )}

            {/* Nabierajace platnosci (upcoming) */}
            {upcomingItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Nabierajace platnosci ({upcomingItems.length})
                </p>
                <div className="space-y-1">
                  {upcomingItems.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs px-3 py-2 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-700">{item.name}</span>
                        <span className="text-zinc-400">{fmt(item.amount)}</span>
                        <span className="text-zinc-400">· {freqLabel(item.frequency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">
                          {item.due_date ? new Date(item.due_date + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" }) : "—"}
                        </span>
                        <button onClick={() => togglePaid(item.id, true)}
                          className="text-[10px] text-green-600 hover:text-green-700 font-medium">
                          Oplacono
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista kosztow */}
            <div className="space-y-1">
              {costItems.map((item) => {
                const daysUntilDue = item.due_date
                  ? Math.ceil((new Date(item.due_date + "T12:00:00").getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white border border-zinc-100 rounded-lg hover:bg-zinc-50 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <input type="checkbox" checked={item.is_paid} onChange={() => togglePaid(item.id, !item.is_paid)}
                        className="rounded border-zinc-300 text-[#0d9488] focus:ring-[#0d9488]/20 shrink-0" />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${item.is_paid ? "text-zinc-400 line-through" : "text-zinc-700"}`}>
                          {item.name}
                        </p>
                        <p className="text-zinc-400">
                          <span className="capitalize">{item.category}</span>
                          <span className="mx-1">·</span>
                          {freqLabel(item.frequency)}
                          {daysUntilDue !== null && !item.is_paid && (
                            <>
                              <span className="mx-1">·</span>
                              <span className={daysUntilDue <= 7 ? "text-red-500 font-medium" : "text-zinc-400"}>
                                {daysUntilDue <= 0 ? "termin!" : `${daysUntilDue} dni`}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-medium ${item.is_paid ? "text-green-500" : "text-zinc-700"}`}>{fmt(item.amount)}</span>
                      {item.due_date && (
                        <span className="text-zinc-400">{new Date(item.due_date + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</span>
                      )}
                      <button onClick={() => deleteCostItem(item.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add item button + form */}
            {!showAddItem ? (
              <button onClick={() => setShowAddItem(true)}
                className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium">
                + Dodaj koszt
              </button>
            ) : (
              <div className="bg-brand-50 dark:bg-brand-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Nazwa" className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]" />
                  <input type="number" value={newItem.amount || ""} onChange={(e) => setNewItem({ ...newItem, amount: Number(e.target.value) })}
                    placeholder="Kwota" className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]" />
                  <select value={newItem.frequency} onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]">
                    <option value="monthly">Miesieczny</option>
                    <option value="quarterly">Kwartalny</option>
                    <option value="yearly">Roczny</option>
                    <option value="one-time">Jednorazowy</option>
                    <option value="irregular">Nieregularny</option>
                  </select>
                  <input type="date" value={newItem.due_date} onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]">
                    <option value="marketing">Marketing</option>
                    <option value="server">Serwer / hosting</option>
                    <option value="tools">Narzedzia</option>
                    <option value="domain">Domena</option>
                    <option value="api">API / keys</option>
                    <option value="other">Inne</option>
                  </select>
                  <input value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Notatki" className="px-3 py-2 border border-zinc-200 dark:border-brand-600 rounded-lg text-xs bg-white dark:bg-brand-900 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-[#0d9488]" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => saveCostItem(newItem)} disabled={!newItem.name || !newItem.amount}
                    className="px-4 py-1.5 text-xs font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] disabled:opacity-50 transition">
                    Dodaj
                  </button>
                  <button onClick={() => setShowAddItem(false)}
                    className="px-4 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-brand-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-brand-600 transition">
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tabela firm ── */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 text-xs border-b border-zinc-200 dark:border-brand-700 bg-white dark:bg-brand-900">
                <th className="p-3 font-semibold">Firma</th>
                <th className="p-3 font-semibold">Plan</th>
                <th className="p-3 font-semibold">Rozmowy</th>
                <th className="p-3 font-semibold">Minuty</th>
                <th className="p-3 font-semibold">ElevenLabs</th>
                <th className="p-3 font-semibold">Twilio</th>
                <th className="p-3 font-semibold">OpenRouter</th>
                <th className="p-3 font-semibold">SMS</th>
                <th className="p-3 font-semibold">Koszt</th>
                <th className="p-3 font-semibold">Przychod std</th>
                <th className="p-3 font-semibold">Rabat</th>
                <th className="p-3 font-semibold">Przychod</th>
                <th className="p-3 font-semibold">Marza</th>
                <th className="p-3 font-semibold">Marza %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="text-center py-8 text-zinc-400 text-xs">Ladowanie...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-zinc-400 text-xs">Brak danych</td></tr>
              ) : (
                filtered.map((b) => {
                  const stdRevenue = b.is_centrala ? 0 : getPlanRevenue(b.plan);
                  const effectiveRevenue = b.customRevenue ?? b.revenue;
                  const discountPct = stdRevenue > 0 && b.customRevenue !== null ? Math.round((1 - b.customRevenue / stdRevenue) * 100) : 0;
                  const margin = effectiveRevenue - b.totalCost;
                  const marginPctVal = effectiveRevenue > 0 ? (margin / effectiveRevenue) * 100 : 0;
                  const marginColor = marginPctVal > 20 ? "text-green-600" : marginPctVal >= 0 ? "text-amber-600" : "text-red-500";
                  const barColor = marginPctVal > 20 ? "bg-green-500" : marginPctVal >= 0 ? "bg-amber-500" : "bg-red-500";

                  return (
                    <>
                    <tr className={`border-b border-zinc-100 dark:border-brand-800 last:border-b-0 hover:bg-[#f0fdfa] dark:hover:bg-brand-800/20 transition cursor-pointer ${b.is_centrala ? "bg-amber-50/50 dark:bg-amber-900/10" : ""} ${expandedBiz === b.id ? "bg-[#f0fdfa] dark:bg-brand-800/20" : ""}`}
                      onClick={() => setExpandedBiz(expandedBiz === b.id ? null : b.id)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] transition ${expandedBiz === b.id ? "text-[#0d9488]" : "text-zinc-300 dark:text-zinc-500"}`}>{expandedBiz === b.id ? "▼" : "▶"}</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{b.name}</span>
                          {b.is_centrala && <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full px-1.5 py-0.5 font-medium">Centrala</span>}
                          {b.plan === "elastic_0" && <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 font-medium">Pay-as-you-go</span>}
                        </div>
                        {b.calls === 0 && !b.is_centrala && b.plan !== "elastic_0" && <span className="text-[10px] text-zinc-400">(brak polaczen)</span>}
                      </td>
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 text-xs">{getPlanLabel(b.plan)}</td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300">{b.calls}</td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300">{b.minutes.toFixed(1)}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{fmt(b.costElevenlabs)}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{fmt(b.costTwilio)}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{fmt(b.costOpenrouter)}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{fmt(b.costSms)}</td>
                      <td className="p-3 text-red-600 font-medium">{fmt(b.totalCost)}</td>
                      <td className="p-3 text-zinc-500 dark:text-zinc-400">{fmt(stdRevenue)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={0} max={100} defaultValue={String(discountPct)}
                            onChange={(e) => {
                              const pct = Number(e.target.value);
                              if (pct >= 0 && pct <= 100) handleDiscountChange(b.id, Math.round(stdRevenue * (1 - pct / 100) * 100) / 100);
                            }}
                            className="w-14 px-1.5 py-1 border border-zinc-200 dark:border-brand-700 rounded text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-brand-800 text-center focus:outline-none focus:border-[#0d9488]"
                            disabled={savingDiscount === b.id}
                            onClick={(e) => e.stopPropagation()} />
                          <span className="text-[10px] text-zinc-400">%</span>
                        </div>
                      </td>
                      <td className={`p-3 font-medium ${b.customRevenue !== null ? "text-amber-600" : "text-[#0d9488]"}`}>{fmt(effectiveRevenue)}</td>
                      <td className={`p-3 font-medium ${marginColor}`}>{margin >= 0 ? "+" : ""}{fmt(margin)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-brand-50 dark:bg-brand-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(0, marginPctVal))}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${marginColor}`}>{marginPctVal.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                    {expandedBiz === b.id && (
                      <tr key={`${b.id}-calls`}>
                        <td colSpan={14} className="p-0">
                          <div className="bg-zinc-50 dark:bg-brand-950 border-b border-zinc-200 dark:border-brand-700 px-5 py-4">
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-3">Szczegoly polaczen</p>
                            {(() => {
                              const bizCalls = callLogs.filter((c) => c.business_id === b.id);
                              if (bizCalls.length === 0) return <p className="text-xs text-zinc-400">Brak polaczen w tym okresie</p>;
                              return (
                                <div className="space-y-1 max-h-80 overflow-y-auto">
                                  {bizCalls.sort((a, c) => c.created_at?.localeCompare(a.created_at || "") || 0).map((c) => (
                                    <div key={c.id} className="flex items-center justify-between text-xs px-3 py-2 bg-white dark:bg-brand-900 border border-zinc-100 dark:border-brand-800 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <span className="text-zinc-400 dark:text-zinc-500 w-28">{new Date(c.created_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                        <span className="text-zinc-500 dark:text-zinc-400 font-mono">{c.from_number || "—"}</span>
                                        <span className="text-zinc-400 dark:text-zinc-500">{(c.duration_seconds || 0) >= 60 ? `${Math.round((c.duration_seconds || 0) / 60)} min` : `${c.duration_seconds || 0} s`}</span>
                                      </div>
                                      <span className="font-medium text-red-500">{fmt((Number(c.cost_elevenlabs) || 0) + (Number(c.cost_twilio) || 0) + (Number(c.cost_openrouter) || 0))}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Podsumowanie zyskow/strat ── */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">📊 Podsumowanie finansowe</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Przychod (klienci)</p>
            <p className="text-lg font-bold text-[#0d9488]">{fmt(totalRevenue)}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Koszt uslug (klienci)</p>
            <p className="text-lg font-bold text-red-500">{fmt(clientCost)}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Koszt centrali</p>
            <p className="text-lg font-bold text-amber-600">{fmt(centralaCost)}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Koszty wlasne</p>
            <p className="text-lg font-bold text-amber-500">{fmt(totalOwnCosts)}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Wynik (klienci)</p>
            <p className={`text-lg font-bold ${totalRevenue - clientCost >= 0 ? "text-green-600" : "text-red-500"}`}>
              {totalRevenue - clientCost >= 0 ? "+" : ""}{fmt(totalRevenue - clientCost)}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-brand-800 rounded-lg p-3">
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Wynik calkowity</p>
            <p className={`text-lg font-bold ${totalMargin >= 0 ? "text-green-600" : "text-red-500"}`}>
              {totalMargin >= 0 ? "+" : ""}{fmt(totalMargin)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">Wybrano: <strong className="text-zinc-700 dark:text-zinc-200">{filtered.length}</strong> firm</span>
          <span className="text-zinc-200 dark:text-zinc-600">|</span>
          <span className="text-zinc-400">Uslugi: <strong className="text-red-600">{fmt(totalCost)}</strong></span>
          <span className="text-zinc-200 dark:text-zinc-600">|</span>
      <span className="text-zinc-400">Centrala: <strong className="text-amber-600">{fmt(centralaCost)}</strong></span>
      <span className="text-zinc-200 dark:text-zinc-600">|</span>
      <span className="text-zinc-400">Klienci: <strong className="text-red-500">{fmt(clientCost)}</strong></span>
      <span className="text-zinc-200 dark:text-zinc-600">|</span>
      <span className="text-zinc-400">Wlasne: <strong className="text-amber-600">{fmt(totalOwnCosts)}</strong></span>
          <span className="text-zinc-200 dark:text-zinc-600">|</span>
          <span className="text-zinc-400">Lacznie: <strong className="text-red-700">{fmt(totalAllCosts)}</strong></span>
          <span className="text-zinc-200 dark:text-zinc-600">|</span>
          <span className="text-zinc-400">Przychod: <strong className="text-[#0d9488]">{fmt(totalRevenue)}</strong></span>
          <span className="text-zinc-200 dark:text-zinc-600">|</span>
          <span className="text-zinc-400">Marza: <strong className={totalMargin >= 0 ? "text-green-600" : "text-red-500"}>{fmt(totalMargin)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!confirm("CZY NA PEWNO? To usunie WSZYSTKIE dane testowe: call_logs, rozmowy, SMS, notyfikacje, leady. Tej operacji NIE MOZNA cofnac. Kontynuowac?")) return;
              if (!confirm("NAPRAWDE? Wszystkie statystyki zostana zresetowane do zera. To nie jest zabawa.")) return;
              try {
                const r = await fetch("/api/admin/reset-stats", { method: "POST" });
                const d = await r.json();
                alert(d.message || "OK");
                if (r.ok) fetchData();
              } catch { alert("Blad resetowania"); }
            }}
            className="text-xs px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition"
            title="Usuwa wszystkie dane testowe (call_logs, rozmowy, SMS, leady, rezerwacje, koszty)"
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
