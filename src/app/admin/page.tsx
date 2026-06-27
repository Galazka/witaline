"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import AdminCouponsPanel from "@/components/AdminCouponsPanel";
import AdminBusinessEditor from "@/components/AdminBusinessEditor";
import AdminConversations from "@/components/AdminConversations";
import AdminBusinessesTable from "@/components/AdminBusinessesTable";
import AdminLeadsTable from "@/components/AdminLeadsTable";
import AdminVoiceConfig from "@/components/AdminVoiceConfig";
import AdminProfitability from "@/components/AdminProfitability";
import AdminContactMessages from "@/components/AdminContactMessages";
import AdminFeedback from "@/components/AdminFeedback";
import AdminCallbackRequests from "@/components/AdminCallbackRequests";
import AdminGdprTool from "@/components/AdminGdprTool";
import AdminBlocklist from "@/components/AdminBlocklist";
import AdminDashboard from "@/components/AdminDashboard";
import AdminStats from "@/components/AdminStats";
import AdminSmsLogs from "@/components/AdminSmsLogs";
import AdminSmsManagement from "@/components/AdminSmsManagement";
import AdminDtmfLogs from "@/components/AdminDtmfLogs";
import AdminSecurityDashboard from "@/components/AdminSecurityDashboard";
import AdminRealCosts from "@/components/AdminRealCosts";
import AdminDailyCosts from "@/components/AdminDailyCosts";
import AdminBusinessDetail from "@/components/AdminBusinessDetail";
import ConsultantListManager from "@/components/ConsultantListManager";
import AdminPortRequests from "@/components/AdminPortRequests";
import AdminPhoneStats from "@/components/AdminPhoneStats";
import AdminPricingSimulator from "@/components/AdminPricingSimulator";
import AdminWebhookLogs from "@/components/AdminWebhookLogs";
import AdminEmailConfigurator from "@/components/AdminEmailConfigurator";
import AdminLiveChat from "@/components/AdminLiveChat";
import AdminSupportAgents from "@/components/AdminSupportAgents";
import AdminVerificationManager from "@/components/AdminVerificationManager";
import { useAdminTab } from "@/components/layout/AdminLayout";

export default function AdminPage() {
  const { tab, setTab, data, refresh } = useAdminTab();
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null);
  const [detailBusinessId, setDetailBusinessId] = useState<string | null>(null);
  const [smsView, setSmsView] = useState<"management" | "logs">("management");
  const [witaLinePhone, setWitaLinePhone] = useState("");
  const [witaLineSaving, setWitaLineSaving] = useState(false);
  const [witaLineToast, setWitaLineToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [error, setError] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchWitaline = async () => {
      const { data: biz } = await supabase.from("businesses").select("phone").eq("id", "00000000-0000-0000-0000-000000000001").maybeSingle();
      if (biz?.phone) setWitaLinePhone(biz.phone);
    };
    fetchWitaline();
  }, [supabase]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (tab === "leads" || tab === "dashboard") refresh();
  }, [tab, refresh]);

  async function handleExport(type: string) {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `witaline-${type}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { setToast({ ok: false, msg: "Błąd eksportu" }); }
    setShowExport(false);
    setExporting(false);
  }

  async function handleSyncCalls() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-calls", { method: "POST" });
      const data = await res.json();
      setToast({ ok: res.ok, msg: res.ok ? `Zsynchronizowano ${data.inserted || 0} rozmów` : data.error || "Błąd synchronizacji" });
    } catch { setToast({ ok: false, msg: "Błąd synchronizacji" }); }
    setSyncing(false);
  }

  async function handleClearData() {
    setClearing(true);
    try {
      const { error: err } = await supabase.from("call_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setToast({ ok: !err, msg: err ? "Błąd czyszczenia" : "Dane wyczyszczone" });
    } catch { setToast({ ok: false, msg: "Błąd czyszczenia" }); }
    setShowClearConfirm(false);
    setClearing(false);
  }

  async function saveWitaLinePhone() {
    setWitaLineSaving(true);
    const { error: err } = await supabase.from("businesses").update({ phone: witaLinePhone }).eq("id", "00000000-0000-0000-0000-000000000001");
    setWitaLineToast(err ? "Błąd zapisu" : "Zapisano!");
    setWitaLineSaving(false);
    setTimeout(() => setWitaLineToast(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-50/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-brand-50/10 rounded-full blur-3xl" />
      </div>

      {error && <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</p>}
      {toast && (
        <div className={`animate-slide-in px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-sm ${toast.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span> {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportRef}>
            <button onClick={() => setShowExport(!showExport)} disabled={exporting} className="btn-ghost text-xs disabled:opacity-40">
              {exporting ? "Eksportowanie..." : "Export"}
            </button>
            {showExport && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-xl py-1 min-w-[180px] z-50">
                {[["call_logs", "Call Logs"], ["conversations", "Rozmowy"], ["sms_logs", "SMS Logs"], ["all", "Wszystko"]].map(([val, label]) => (
                  <button key={val} onClick={() => handleExport(val)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-brand-50 transition-colors">{label}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSyncCalls} disabled={syncing} className="btn-ghost text-xs text-brand-500 hover:text-brand-600 disabled:opacity-40">
            {syncing ? "Sync..." : "Sync rozmowy"}
          </button>
          <button onClick={() => setShowClearConfirm(true)} disabled={clearing} className="btn-ghost text-xs text-red-500 hover:text-red-600 disabled:opacity-40">
            {clearing ? "Czyszczenie..." : "Wyczyść dane"}
          </button>
        </div>
      </div>

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm shadow-xl animate-fade-in-up">
            <h3 className="font-semibold text-zinc-900 mb-2">Wyczyścić wszystkie dane?</h3>
            <p className="text-sm text-zinc-500 mb-4">Tej operacji nie można cofnąć. Call logs zostaną trwale usunięte.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-sm rounded-xl bg-zinc-100 hover:bg-zinc-200 transition font-medium">Anuluj</button>
              <button onClick={handleClearData} disabled={clearing} className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 font-medium">{clearing ? "Czyszczenie..." : "Potwierdź usunięcie"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="stagger">
      {tab === "dashboard" && <AdminDashboard />}

      {tab === "leads" && (
        <AdminLeadsTable leads={data?.leads || []} onRefresh={refresh} onActivate={(id, prompt) => handleActivate(id, prompt)} />
      )}

      {tab === "businesses" && (
        detailBusinessId ? (
          <AdminBusinessDetail businessId={detailBusinessId} onBack={() => setDetailBusinessId(null)} onEdit={(id) => setEditingBusiness(id)} />
        ) : (
          <AdminBusinessesTable onEdit={(id) => setEditingBusiness(id)} onRefresh={refresh} onDetail={(id) => setDetailBusinessId(id)} />
        )
      )}

      {tab === "witaline" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-white border border-brand-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">WitaLine / linia główna</h2>
                <p className="text-sm text-zinc-500 mt-1">Osobne menu dla numeru konsultanta głównej linii WitaLine.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold">W</div>
            </div>
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Numer konsultanta WitaLine</label>
                <input value={witaLinePhone} onChange={(e) => setWitaLinePhone(e.target.value)} placeholder="+48 123 456 789" className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveWitaLinePhone} disabled={witaLineSaving} className="btn-primary text-sm">{witaLineSaving ? "Zapisywanie..." : "Zapisz"}</button>
                {witaLineToast && <span className="text-xs text-zinc-500">{witaLineToast}</span>}
              </div>
            </div>
            <ConsultantListManager businessId="00000000-0000-0000-0000-000000000001" />
          </div>
        </div>
      )}

      {tab === "messages" && <AdminContactMessages />}
      {tab === "live-chat" && <AdminLiveChat />}
      {tab === "webhooks" && <AdminWebhookLogs />}
      {tab === "feedback" && <AdminFeedback />}
      {tab === "conversations" && <AdminConversations />}
      {tab === "statystyki" && <AdminStats />}
      {tab === "kalkulator" && <AdminProfitability />}
      {tab === "voice" && <AdminVoiceConfig />}
      {tab === "coupons" && <AdminCouponsPanel />}
      {tab === "callbacks" && <AdminCallbackRequests />}
      {tab === "rodo" && <AdminGdprTool supabase={supabase} />}

      {tab === "sms" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setSmsView("management")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${smsView === "management" ? "bg-brand-400 text-white" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"}`}>Zarządzanie SMS</button>
            <button onClick={() => setSmsView("logs")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${smsView === "logs" ? "bg-brand-400 text-white" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"}`}>Logi SMS</button>
          </div>
          {smsView === "management" ? <AdminSmsManagement /> : <AdminSmsLogs />}
        </div>
      )}

      {tab === "routing" && <AdminDtmfLogs />}
      {tab === "blocklist" && <AdminBlocklist />}
      {tab === "security" && <AdminSecurityDashboard />}
      {tab === "costs" && <AdminDailyCosts />}
      {tab === "porty" && <AdminPortRequests />}
      {tab === "numery" && <AdminPhoneStats />}
      {tab === "pricing" && <AdminPricingSimulator />}
      {tab === "email" && <AdminEmailConfigurator />}
{tab === "agents" && <AdminSupportAgents />}
       {tab === "verifications" && <AdminVerificationManager />}
       </div>
    </div>
  );

  function handleActivate(id: string, prompt: string) {
    console.log("[AdminPage] activate lead", id, prompt?.slice(0, 50));
    refresh();
  }
}
