"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead, Business } from "@/types/database";
import { useAdminTab } from "@/components/layout/AdminLayout";
import ProviderBalanceWidget from "./ProviderBalanceWidget";

interface DashboardStats {
  totalBusinesses: number;
  totalLeads: number;
  totalCalls: number;
  totalCost: string;
  todayCalls: number;
  activeSubscriptions: number;
  suspendedCount: number;
}

interface BizWithStats extends Business {
  stats?: { totalCalls: number; orders: number };
}

interface SmsOverview {
  totalUsed: number;
  totalCapacity: number;
  businessesWithData: number;
}

interface ActivityItem {
  type: "new_lead" | "new_business" | "call_made" | "payment_issue";
  label: string;
  detail: string;
  time: string;
  id?: string;
  tab?: string;
}

export default function AdminDashboard() {
  const { setTab } = useAdminTab();
  const [businesses, setBusinesses] = useState<BizWithStats[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [smsOverview, setSmsOverview] = useState<SmsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [costRange, setCostRange] = useState<"all" | "today" | "7d" | "30d">("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, smsRes] = await Promise.all([
        fetch(`/api/admin/dashboard?range=${costRange}`),
        fetch("/api/admin/sms/usage"),
      ]);

      if (!dashRes.ok) {
        if (dashRes.status === 401) setError("Brak uprawnień admina");
        else setError("Błąd ładowania danych");
        return;
      }

      const dashData = await dashRes.json();
      setBusinesses(dashData.businesses || []);
      setLeads(dashData.leads || []);
      setStats(dashData.stats);

      if (smsRes.ok) {
        const smsData: Array<{ smsUsed: number; totalCapacity: number }> = await smsRes.json();
        setSmsOverview({
          totalUsed: smsData.reduce((a, b) => a + b.smsUsed, 0),
          totalCapacity: smsData.reduce((a, b) => a + b.totalCapacity, 0),
          businessesWithData: smsData.length,
        });
      }
    } catch {
      setError("Błąd połączenia z serwerem");
    }
    setLoading(false);
  }, [costRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const now = new Date();
  const todayStr = now.toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const newLeads = leads.filter((l) => l.status === "new").length;
  const pastDueBusinesses = businesses.filter(
    (b) => b.subscription_status === "past_due"
  ).length;
  const trialingBusinesses = businesses.filter(
    (b) => b.subscription_status === "trialing"
  ).length;

  const recentActivity: ActivityItem[] = [
    ...leads.slice(0, 2).map((l) => ({
      type: "new_lead" as const,
      label: "Nowy lead",
      detail: `${l.company_name || l.contact_email || l.phone || "Anonim"}`,
      time: l.created_at,
      tab: "leads",
    })),
    ...businesses.slice(0, 2).map((b) => ({
      type: "new_business" as const,
      label: "Nowa firma",
      detail: b.name,
      time: b.created_at,
      tab: "businesses",
    })),
    ...(pastDueBusinesses > 0
      ? [
          {
            type: "payment_issue" as const,
            label: "Zaległa płatność",
            detail: `${pastDueBusinesses} firm${pastDueBusinesses > 1 ? "y" : "a"} z przeterminowaną subskrypcją`,
            time: now.toISOString(),
          },
        ]
      : []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const smsPct = smsOverview && smsOverview.totalCapacity > 0
    ? Math.round((smsOverview.totalUsed / smsOverview.totalCapacity) * 100)
    : 0;

  if (loading) {
    return <p className="text-sm text-zinc-400 text-center py-12">Ladowanie dashboardu...</p>;
  }

  if (error) {
    return <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Greeting + date */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Panel administracyjny</p>
          <p className="text-xs text-zinc-400">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 rounded-lg p-0.5">
            {(["all", "30d", "7d", "today"] as const).map((r) => (
              <button key={r} onClick={() => setCostRange(r)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition ${costRange === r ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
                {r === "all" ? "Calosc" : r === "30d" ? "30 dni" : r === "7d" ? "7 dni" : "Dzis"}
              </button>
            ))}
          </div>
          <button onClick={fetchAll} className="btn-ghost text-xs">Odświez</button>
        </div>
      </div>

      {/* Provider balances */}
      <ProviderBalanceWidget />

      {/* KPI cards — stagger animation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
        {[
          { label: "Firmy", value: stats?.totalBusinesses || 0, color: "text-zinc-900", sub: `+${trialingBusinesses} na trialu`, icon: "🏢" },
          { label: "Aktywne", value: stats?.activeSubscriptions || 0, color: "text-[#0d9488]", sub: `${((stats?.activeSubscriptions || 0) / Math.max(stats?.totalBusinesses || 1, 1)) * 100}%`, icon: "✓" },
          { label: "Zawieszone", value: stats?.suspendedCount || 0, color: "text-amber-600", sub: "Wymagaja uwagi", icon: "⚠" },
          { label: "Rozmowy dzis", value: stats?.todayCalls || 0, color: "text-[#0d9488]", sub: `${stats?.totalCalls || 0} lacznie`, icon: "📞" },
          { label: "Nowe leady", value: newLeads, color: newLeads > 0 ? "text-violet-500" : "text-zinc-400", sub: `${leads.length} wszystkich`, icon: "🎯" },
          { label: "Koszt", value: `${(stats?.totalCost || "0.00").replace(".", ",")} zl`, color: "text-zinc-900", sub: costRange === "all" ? "Calkowity koszt" : costRange === "today" ? "Koszt dzis" : costRange === "7d" ? "Koszt 7 dni" : "Koszt 30 dni", icon: "💰" },
        ].map((kpi) => (
          <div key={kpi.label} className="card-kpi">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider">{kpi.label}</p>
              <span className="text-xs">{kpi.icon}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout: Activity + SMS + Revenue */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 card-modern p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Ostatnia aktywność</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">Brak aktywnosci</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  onClick={() => item.tab && setTab(item.tab as any)}
                  className={`flex items-start gap-3 ${item.tab ? "cursor-pointer hover:bg-[#f0fdfa]/50 rounded-lg px-2 -mx-2 transition-colors" : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.type === "new_lead" ? "bg-violet-400" :
                    item.type === "new_business" ? "bg-[#0d9488]" :
                    item.type === "payment_issue" ? "bg-red-400" : "bg-brand-200"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                    <p className="text-xs text-zinc-500 truncate">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(item.time).toLocaleDateString("pl-PL", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* SMS overview */}
          <div className="card-modern p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">SMS</h3>
            {smsOverview ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-zinc-900">{smsOverview.totalUsed}</span>
                  <span className="text-xs text-zinc-400">/ {smsOverview.totalCapacity}</span>
                </div>
                <div className="w-full h-2 bg-brand-50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${smsPct > 80 ? "bg-red-500" : smsPct > 50 ? "bg-amber-500" : "bg-[#0d9488]"}`}
                    style={{ width: `${Math.min(100, smsPct)}%` }} />
                </div>
                <p className="text-xs text-zinc-400">{smsPct}% wykorzystano ({smsOverview.businessesWithData} firm)</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 text-center py-4">Brak danych SMS</p>
            )}
          </div>

          {/* Revenue estimate */}
          <div className="card-modern p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Przychod (szac.)</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400">Koszt polaczen (7 dni)</p>
                <p className="text-lg font-bold text-red-500">{stats?.totalCost || "0.00"} zl</p>
                <p className="text-[10px] text-zinc-400">koszt za uzyte minuty (elastyczny cennik)</p>
              </div>
              <div className="border-t border-zinc-100 pt-2">
                <p className="text-xs text-zinc-400">Rozmowy (7 dni)</p>
                <p className="text-lg font-bold text-zinc-900">{stats?.totalCalls || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business health + Lead pipeline */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Business health */}
        <div className="card-modern p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Stan firm</h3>
          <div className="space-y-3">
            {[
              { label: "Aktywne / Trial", count: stats?.activeSubscriptions || 0, color: "bg-[#0d9488]" },
              { label: "Zawieszone", count: stats?.suspendedCount || 0, color: "bg-amber-400" },
              { label: "Zalegle platnosci", count: pastDueBusinesses, color: "bg-red-400" },
              { label: "Bez subskrypcji", count: Math.max(0, (stats?.totalBusinesses || 0) - (stats?.activeSubscriptions || 0) - (stats?.suspendedCount || 0)), color: "bg-brand-200" },
            ].map((item) => {
              const total = stats?.totalBusinesses || 1;
              const pct = (item.count / total) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: item.color === "bg-[#0d9488]" ? "#0d9488" : item.color === "bg-amber-400" ? "#F59E0B" : item.color === "bg-red-400" ? "#EF4444" : "#D4D4D8" }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700">{item.label}</span>
                      <span className="text-sm font-medium text-zinc-900">{item.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-50 rounded-full mt-1">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead pipeline */}
        <div className="card-modern p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Leady</h3>
          <div className="space-y-3">
            {[
              { label: "Nowe", count: newLeads, color: "text-violet-600", bg: "bg-violet-100" },
              { label: "W kontakcie", count: leads.filter((l) => l.status === "processed").length, color: "text-blue-600", bg: "bg-blue-100" },
              { label: "Aktywne (firmy)", count: leads.filter((l) => l.status === "active").length, color: "text-[#0d9488]", bg: "bg-brand-100" },
              { label: "Kosz", count: leads.filter((l) => l.status === "trashed").length, color: "text-zinc-600", bg: "bg-brand-50" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-zinc-700">{item.label}</span>
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${item.color} ${item.bg}`}>
                  {item.count}
                </span>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">Brak leadow</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: "Nowe leady", desc: `${newLeads} czeka na kontakt`, action: "leads", icon: "🎯" },
          { label: "Zalegle platnosci", desc: `${pastDueBusinesses} firm`, action: "businesses", icon: "⚠" },
          { label: "Firmy na trialu", desc: `${trialingBusinesses} koncza sie`, action: "businesses", icon: "🕐" },
          { label: "Zawieszone", desc: `${stats?.suspendedCount || 0} firm`, action: "businesses", icon: "⏸" },
        ].map((card) => (
          <div key={card.label} className="card-kpi cursor-default">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-zinc-900">{card.label}</h4>
              <span className="text-xs">{card.icon}</span>
            </div>
            <p className="text-xs text-zinc-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
