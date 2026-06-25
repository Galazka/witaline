"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import AccountBalance from "@/components/AccountBalance";
import ElasticCostCalculator from "@/components/ElasticCostCalculator";
import CallTable from "@/components/CallTable";
import PlanUpgrade from "@/components/PlanUpgrade";
import ReferralCard from "@/components/ReferralCard";
import PhoneSettings from "@/components/PhoneSettings";
import ChatHistory from "@/components/ChatHistory";
import AccountSettings from "@/components/AccountSettings";
import SecuritySettings from "@/components/SecuritySettings";
import SecurityCenter from "@/components/SecurityCenter";
import ActivityFeed from "@/components/ActivityFeed";
import CalendarView from "@/components/CalendarView";
import NewReservationForm from "@/components/NewReservationForm";
import ReservationsTable from "@/components/ReservationsTable";
import CalendarEditor from "@/components/CalendarEditor";
import SmsHistory from "@/components/SmsHistory";
import LeadsView from "@/components/LeadsView";
import VoiceCloneManager from "@/components/VoiceCloneManager";
import CrmPipeline from "@/components/CrmPipeline";
import TrendKpiCard from "@/components/TrendKpiCard";
import SmsStatusWidget from "@/components/SmsStatusWidget";
import StatsOverview from "@/components/StatsOverview";
import RecentChatsPreview from "@/components/RecentChatsPreview";
import RecentCallsPreview from "@/components/RecentCallsPreview";
import DashboardWidgets from "@/components/DashboardWidgets";
import PromptConfigurator from "@/components/PromptConfigurator";
import KnowledgeManager from "@/components/KnowledgeManager";
import WidgetSettings from "@/components/WidgetSettings";
import ServicesEditor from "@/components/ServicesEditor";
import FeedbackPanel from "@/components/FeedbackPanel";
import WeeklyReport from "@/components/WeeklyReport";
import IntegrationsDashboard from "@/components/IntegrationsDashboard";
import IntegrationsSettings from "@/components/IntegrationsSettings";
import WebhookApiSettings from "@/components/WebhookApiSettings";
import GoogleCalendarSettings from "@/components/GoogleCalendarSettings";
import NotificationsPanel from "@/components/NotificationsPanel";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ConsultantListManager from "@/components/ConsultantListManager";
import BillingHistory from "@/components/BillingHistory";
import { t, initLocale } from "@/lib/i18n";
import { getPlanConfig, formatPLN } from "@/lib/pricing";
import { useDashboardTab, useDashboardPerms } from "@/components/layout/DashboardLayout";
import type { CallLog, PlanKey, Business, Reservation, Feedback, Service } from "@/types/database";

export default function DashboardPage() {
  const { tab, setTab } = useDashboardTab();
  const [business, setBusiness] = useState<Business | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
  const [subStatus, setSubStatus] = useState<string>("");
  const [trialEndsAt, setTrialEndsAt] = useState<string>("");
  const [subLoading, setSubLoading] = useState(true);
  const [buyingMinutes, setBuyingMinutes] = useState(false);
  const { setPerms, hasPerm } = useDashboardPerms();

  const supabase = createClient();

  const isTrialExpired = subStatus === "trialing" && trialEndsAt && new Date(trialEndsAt) < new Date();
  const isBlocked = isTrialExpired || subStatus === "past_due" || subStatus === "canceled" || subStatus === "incomplete";

  const alwaysAccessible = ["overview", "upgrade", "account", "security"];
  const tabBlocked = isBlocked && !alwaysAccessible.includes(tab);

  useEffect(() => { initLocale(); fetchAll(); }, []);

  useEffect(() => {
    if (business) {
      fetch(`/api/stripe/status?businessId=${business.id}`)
        .then(r => r.json())
        .then(d => { setSubStatus(d.status || ""); setTrialEndsAt(d.trialEndsAt || ""); setSubLoading(false); })
        .catch(() => setSubLoading(false));
    }
  }, [business]);

  async function fetchAll() {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user) { setLoading(false); return; }
    const uid = s.user.id;
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_uid", uid).maybeSingle();
    if (biz) {
      setBusiness(biz as Business);
      // Fetch permissions for RBAC
      fetch(`/api/business/permissions?businessId=${biz.id}`)
        .then(r => r.json())
        .then(p => {
          if (p.role || p.isOwner) {
            setPerms(p.role || null, p.isOwner, p.isSuperAdmin, p.permissions || []);
          }
        })
        .catch((e) => console.error("[dashboard] fetch error:", e));
      const [logsRes, reservationsRes, feedbackRes] = await Promise.all([
        supabase.from("call_logs").select("*").eq("business_id", biz.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(50),
        supabase.from("reservations").select("*").eq("business_id", biz.id).order("reserved_at", { ascending: false }).limit(100),
        fetch(`/api/feedback?businessId=${biz.id}`).then((r) => r.json()),
      ]);
      if (logsRes.data) setCallLogs(logsRes.data as CallLog[]);
      if (reservationsRes.data) setReservations(reservationsRes.data as Reservation[]);
      if (Array.isArray(feedbackRes)) setFeedback(feedbackRes as Feedback[]);
    }
    setLoading(false);
  }

  async function handleReservationStatus(id: string, status: string) {
    await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as Reservation["status"] } : r)));
  }

  async function handleReservationDelete(id: string) {
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setReservations((prev) => prev.filter((r) => r.id !== id));
  }

  const totalSeconds = callLogs.reduce((acc, l) => acc + l.duration_seconds, 0);
  const totalCost = callLogs.reduce((acc, l) => acc + l.cost_pln, 0);
  const ordersCount = callLogs.filter((l) => l.classification === "order").length;
  const helpfulCount = callLogs.filter((l) => l.was_helpful === true).length;
  const avgDuration = callLogs.length > 0 ? Math.round(totalSeconds / callLogs.length) : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCalls = callLogs.filter((l) => l.created_at.startsWith(todayStr));
  const pendingReservations = reservations.filter((r) => r.status === "pending").length;
  const averageRating = feedback.length > 0 ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : "—";

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Ładowanie...</p>
      </div>
    </div>
  );

  return !business ? (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-5">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-brand-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Nie masz jeszcze firmy</h2>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">Aby korzystać z dashboardu, musisz najpierw skonfigurować profil firmy.</p>
        <a href="/register" className="inline-flex items-center gap-2 bg-brand-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 transition shadow-lg shadow-brand-400/20">Skonfiguruj firmę <span>→</span></a>
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-50/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-brand-50/10 rounded-full blur-3xl" />
      </div>

      {business && (
        <DashboardHeader
          minutesUsed={business.minutes_used_this_week}
          plan={business.current_plan as PlanKey}
          totalSavingsMinutes={Math.floor(totalSeconds / 60)}
          extension={business.extension}
          businessName={business.name}
          tokensUsed={business.tokens_used_this_month ?? Math.ceil(Math.floor(totalSeconds / 60) * 1000)}
          subscriptionStatus={subStatus}
          trialEndsAt={trialEndsAt}
          createdAt={business.created_at}
        />
      )}

      {/* Subscription expired banner */}
      {!subLoading && isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 card-lift">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">Okres próbny wygasł</p>
            <p className="text-sm text-red-600 mt-1">Twój asystent AI przestał odbierać telefony. Doładuj konto, aby wznowić działanie — płacisz tylko za użyte minuty, od 1,00 PLN/min brutto.</p>
          </div>
          <button
            onClick={async () => {
              if (!business) return;
              setBuyingMinutes(true);
              try {
                const res = await fetch("/api/stripe/buy-minutes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ businessId: business.id, minutes: 50 }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch (e) { console.error("[dashboard] buy-minutes error:", e); }
              finally { setBuyingMinutes(false); }
            }}
            disabled={buyingMinutes}
            className="shrink-0 bg-brand-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-500 transition shadow-sm disabled:opacity-50"
          >
            {buyingMinutes ? "Przekierowywanie..." : "Doładuj konto"}
          </button>
        </div>
      )}

      {tab === "overview" && business && (
        <div className="space-y-6 stagger">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <TrendKpiCard title="Dzisiaj" value={todayCalls.length} icon={<span>📞</span>} color="brand"
              trend={(() => { const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.toISOString().slice(0, 10); const yCalls = callLogs.filter(l => l.created_at.startsWith(ys)).length; return yCalls > 0 ? Math.round(((todayCalls.length - yCalls) / yCalls) * 100) : 0; })()}
              trendLabel="vs wczoraj" />
            <TrendKpiCard title="Oczekujące rezerwacje" value={pendingReservations} icon={<span>📅</span>} color="amber" />
            <TrendKpiCard title="Średnia ocena" value={averageRating} icon={<span>⭐</span>} color="purple" />
            <TrendKpiCard title="Zaoszczędzony czas" value={`${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`} icon={<span>💰</span>} color="brand"
              trend={Math.round((totalCost > 0 ? (totalSeconds / 3600 * 35 - totalCost) / totalCost * 100 : 0))}
              trendLabel="zwrot z inwestycji" />
            <SmsStatusWidget businessId={business.id} />
          </div>

          <AccountBalance businessId={business.id} sessionUserUid={business.owner_uid} />

          <div className="card-lift bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Kalkulator kosztów</h3>
              <span className="text-xs text-zinc-400">koszty od początku okresu</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Wszystkie rozmowy</p><p className="text-xl font-bold text-zinc-900">{callLogs.length}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Średni czas</p><p className="text-xl font-bold text-zinc-900">{Math.floor(avgDuration / 60)}m {avgDuration % 60}s</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Pozytywnych</p><p className="text-xl font-bold text-zinc-900">{callLogs.length > 0 ? Math.round((helpfulCount / callLogs.length) * 100) : 0}%</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Koszt całkowity</p><p className="text-xl font-bold text-zinc-900">{totalCost.toFixed(2)} PLN</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Zamówienia</p><p className="text-xl font-bold text-zinc-900">{ordersCount}</p></div>
            </div>
          </div>

          <StatsOverview businessId={business.id} />
          <ActivityFeed businessId={business.id} />
          <RecentChatsPreview businessId={business.id} onClick={() => setTab("chats")} />
          <RecentCallsPreview callLogs={callLogs} onClick={() => setTab("calls")} />
          <DashboardWidgets businessId={business.id} />
        </div>
      )}

      {/* Tab content with subscription block */}
      {tabBlocked ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ta sekcja jest zablokowana</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Po wygaśnięciu okresu próbnego funkcje takie jak rozmowy, czaty, SMS-y i leady są niedostępne. Wybierz plan, aby kontynuować.</p>
          <button onClick={() => setTab("upgrade")} className="bg-brand-400 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-500 transition shadow-sm">Wybierz plan</button>
        </div>
      ) : (<>
      {tab === "chats" && business && (
        <div className="space-y-6">
          <NotificationsPanel businessId={business.id} />
          <ChatHistory businessId={business.id} businessPlan={business.current_plan as PlanKey} />
        </div>
      )}

      {tab === "calls" && (
        <CallTable logs={callLogs} loading={loading} showBusiness={false} />
      )}

      {tab === "reservations" && business && (
        <div className="space-y-6">
          <CalendarView
            reservations={reservations}
            year={calYear} month={calMonth}
            onPrevMonth={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
            onNextMonth={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
            onDayClick={(day) => {
              setSelectedDay(day);
              document.getElementById("new-reservation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <div id="new-reservation-form">
            <NewReservationForm
              businessId={business.id}
              onCreated={() => { fetchAll(); setSelectedDay(null); }}
              prefillDate={selectedDay ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}T12:00` : undefined}
              onClose={() => setSelectedDay(null)}
            />
          </div>
          <ReservationsTable
            reservations={reservations} loading={loading}
            onStatusChange={handleReservationStatus} onDelete={handleReservationDelete}
          />
          <CalendarEditor businessId={business.id} initial={business.calendar_settings} onUpdate={() => fetchAll()} />
        </div>
      )}

      {tab === "sms" && business && (
        <SmsHistory businessId={business.id} />
      )}

      {tab === "leads" && business && (
        <LeadsView businessId={business.id} />
      )}

      {tab === "config" && business && (
        <div className="space-y-6">
          {hasPerm("prompts.update") && (
            <PromptConfigurator
              businessId={business.id}
              systemPrompt={business.system_prompt}
              menuCatalog={business.menu_catalog}
              onUpdate={() => fetchAll()}
            />
          )}
          {hasPerm("settings.read") && (
            <>
              <KnowledgeManager businessId={business.id} />
              {hasPerm("settings.update") && <PhoneSettings businessId={business.id} currentNumber={business.phone || ""} onNumberChanged={() => fetchAll()} />}
              {hasPerm("settings.update") && <ConsultantListManager businessId={business.id} />}
              {hasPerm("widget.update") && <WidgetSettings businessId={business.id} />}
              {hasPerm("settings.update") && <ServicesEditor businessId={business.id} services={business.services as Service[]} onUpdate={() => fetchAll()} />}
            </>
          )}
          <CalendarEditor businessId={business.id} initial={business.calendar_settings} onUpdate={() => fetchAll()} />
          <FeedbackPanel feedback={feedback} loading={loading} />
          <WeeklyReport businessId={business.id} />
          {hasPerm("settings.update") && <WebhookApiSettings businessId={business.id} />}
          {hasPerm("settings.update") && <IntegrationsSettings businessId={business.id} />}
          <GoogleCalendarSettings businessId={business.id} />
          <LanguageSwitcher />
        </div>
      )}

      {tab === "upgrade" && business && (
        <div className="grid lg:grid-cols-2 gap-6">
          <ElasticCostCalculator />
          <PlanUpgrade
            businessId={business.id}
            currentPlan={business.current_plan as PlanKey}
            minutesUsed={Math.floor(totalSeconds / 60)}
            onUpdate={fetchAll}
          />
          <div className="lg:col-span-2">
            <ReferralCard businessId={business.id} />
          </div>
        </div>
      )}

      {tab === "security" && business && (
        <div className="space-y-6">
          <SecurityCenter businessId={business.id} />
          <SecuritySettings businessId={business.id} business={business} />
        </div>
      )}

      {tab === "account" && business && (
        <AccountSettings businessId={business.id} balance={business.balance} />
      )}

      {tab === "voice" && business && (
        <div className="space-y-6">
          <VoiceCloneManager
            businessId={business.id}
            currentPlan={business.current_plan}
            currentVoiceId={business.voice_id || undefined}
          />
          <CrmPipeline businessId={business.id} callLogs={callLogs} onNavigate={(key) => { if (key === "chats" || key === "calls" || key === "overview") setTab(key); }} />
        </div>
      )}

      {tab === "integrations" && business && (
        <IntegrationsDashboard businessId={business.id} />
      )}

      {tab === "costs" && business && (
        <div className="space-y-6">
          {/* Monthly usage summary */}
          <div className="card-lift bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Podsumowanie okresu rozliczeniowego</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Plan</p>
                <p className="text-lg font-bold text-zinc-900">{getPlanConfig(business.current_plan as PlanKey).label}</p>
                <p className="text-xs text-zinc-400">{formatPLN(getPlanConfig(business.current_plan as PlanKey).pricePLN)}/mc</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Minuty w planie</p>
                <p className="text-lg font-bold text-zinc-900">{getPlanConfig(business.current_plan as PlanKey).monthlyVoiceMinutes}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Wykorzystano</p>
                <p className="text-lg font-bold text-zinc-900">{Math.floor(totalSeconds / 60)} min</p>
                <p className="text-xs text-zinc-400">{callLogs.length} rozmów</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Średni koszt/min</p>
                <p className="text-lg font-bold text-zinc-900">{totalSeconds > 0 ? formatPLN(totalCost / (totalSeconds / 60)) : formatPLN(0)}</p>
                <p className="text-xs text-zinc-400">{getPlanConfig(business.current_plan as PlanKey).label === "Elastyczny" ? "stawka zmienna" : "średnia ważona"}</p>
              </div>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-brand-400 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (totalSeconds / 60) / getPlanConfig(business.current_plan as PlanKey).monthlyVoiceMinutes * 100)}%` }} />
            </div>
            <p className="text-xs text-zinc-400">{getPlanConfig(business.current_plan as PlanKey).monthlyVoiceMinutes > 0
              ? `${Math.round((totalSeconds / 60) / getPlanConfig(business.current_plan as PlanKey).monthlyVoiceMinutes * 100)}% wykorzystanego limitu`
              : "Brak limitu — płacisz za użycie"}</p>
          </div>

          {/* Detailed cost breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-lift bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Koszty połączeń</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Koszt całkowity</span>
                  <span className="font-semibold text-zinc-900">{formatPLN(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Liczba rozmów</span>
                  <span className="font-semibold text-zinc-900">{callLogs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Średni koszt rozmowy</span>
                  <span className="font-semibold text-zinc-900">{callLogs.length > 0 ? formatPLN(totalCost / callLogs.length) : formatPLN(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Całkowity czas</span>
                  <span className="font-semibold text-zinc-900">{Math.floor(totalSeconds / 3600)}h {Math.floor((totalSeconds % 3600) / 60)}m</span>
                </div>
              </div>
            </div>

            <div className="card-lift bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Oszczędności</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Koszt sekretarki (etat)</span>
                  <span className="font-semibold text-zinc-900">{formatPLN((totalSeconds / 3600) * 35)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Twój koszt z WitaLine</span>
                  <span className="font-semibold text-brand-600">{formatPLN(totalCost)}</span>
                </div>
                <div className="border-t border-zinc-100 pt-2 flex justify-between text-sm">
                  <span className="text-zinc-700 font-medium">Oszczędność</span>
                  <span className="font-bold text-green-600">{formatPLN(Math.max(0, (totalSeconds / 3600) * 35 - totalCost))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Oszczędność czasu</span>
                  <span className="font-semibold text-zinc-900">{Math.floor(totalSeconds / 3600)}h {Math.floor((totalSeconds % 3600) / 60)}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-call cost list */}
          {callLogs.length > 0 && (
            <div className="card-lift bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Szczegóły kosztów</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400 text-[10px] uppercase tracking-wider">
                      <th className="pb-2 pr-2">Rozmowa</th>
                      <th className="pb-2 pr-2">Czas</th>
                      <th className="pb-2 pr-2">Koszt</th>
                      <th className="pb-2 pr-2">Koszt/min</th>
                      <th className="pb-2">Klasyfikacja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {callLogs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="text-zinc-700">
                        <td className="py-2 pr-2 text-zinc-400 font-mono text-xs">{log.caller_id?.slice(0, 12)}</td>
                        <td className="py-2 pr-2">{Math.floor((log.duration_seconds || 0) / 60)}m {(log.duration_seconds || 0) % 60}s</td>
                        <td className="py-2 pr-2 font-medium">{formatPLN(log.cost_pln)}</td>
                        <td className="py-2 pr-2">{(log.duration_seconds || 0) > 0 ? formatPLN(log.cost_pln / ((log.duration_seconds || 0) / 60)) : formatPLN(0)}</td>
                        <td className="py-2 capitalize">{log.classification || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {callLogs.length > 20 && (
                <button onClick={() => setTab("calls")} className="text-xs text-brand-500 hover:text-brand-600 transition">Zobacz wszystkie {callLogs.length} rozmów →</button>
              )}
              <p className="text-[10px] text-zinc-400 pt-2">* Koszty naliczane zgodnie z cennikiem planu {getPlanConfig(business.current_plan as PlanKey).label}. Stawka za dodatkowe minuty: {formatPLN(getPlanConfig(business.current_plan as PlanKey).overagePerToken * 1000)}/min.</p>
            </div>
          )}
        </div>
      )}

      {tab === "billing" && business && (
        <BillingHistory businessId={business.id} />
      )}
      </>)}
    </div>
  );
}
