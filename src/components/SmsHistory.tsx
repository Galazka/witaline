"use client";

import { useEffect, useState } from "react";
import {
  SMS_PACKAGES, TWILIO_SMS_COST_PLN,
  getSmsRemaining, getWaRemaining, formatSmsCost, calculateSmsCost,
} from "@/lib/sms-pricing";

type Tab = "sms" | "whatsapp";

interface SmsLog {
  id: string;
  to_number: string;
  message_body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  cost_pln?: number;
}

interface WaLog {
  id: string;
  to_number: string;
  message_body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  cost_pln?: number;
}

interface BizData {
  sms_used: number;
  sms_limit: number;
  sms_extra_purchased: number;
  wa_used: number;
  wa_limit: number;
  wa_extra_purchased: number;
  prepaid_minutes: number;
}

const statusColors: Record<string, string> = {
  sent: "bg-brand-100 text-brand-500",
  delivered: "bg-brand-100 text-brand-500",
  failed: "bg-red-100 text-red-600",
  pending: "bg-amber-100 text-amber-700",
  queued: "bg-brand-50 text-zinc-500",
};

const statusLabels: Record<string, string> = {
  sent: "Wysłano", delivered: "Dostarczono", failed: "Błąd",
  pending: "Oczekuje", queued: "W kolejce",
};

export default function SmsHistory({ businessId }: { businessId: string }) {
  const [tab, setTab] = useState<Tab>("sms");
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [waLogs, setWaLogs] = useState<WaLog[]>([]);
  const [bizData, setBizData] = useState<BizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/business/sms-logs?businessId=${businessId}`).then(r => r.json()),
      fetch(`/api/business/sms/status?businessId=${businessId}`).then(r => r.json()),
      fetch(`/api/business/sms-logs?businessId=${businessId}&channel=whatsapp`).then(r => r.json().catch(() => [])),
    ]).then(([smsData, statusData, waData]) => {
      setLogs(Array.isArray(smsData) ? smsData : []);
      setBizData(statusData);
      setWaLogs(Array.isArray(waData) ? waData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-center text-zinc-400 py-8 text-sm">Ładowanie...</p>;

  const smsRemaining = bizData ? getSmsRemaining(bizData) : 0;
  const smsTotal = bizData ? (bizData.sms_limit || 0) + (bizData.sms_extra_purchased || 0) : 0;
  const waRemaining = bizData ? getWaRemaining(bizData) : 0;
  const waTotal = bizData ? (bizData.wa_limit || 0) + (bizData.wa_extra_purchased || 0) : 0;

  // Calculate costs
  const activeLogs = tab === "sms" ? logs : waLogs;
  const sentCount = activeLogs.filter(l => l.status === "sent" || l.status === "delivered").length;
  const failedCount = activeLogs.filter(l => l.status === "failed").length;
  const pendingCount = activeLogs.filter(l => l.status === "pending" || l.status === "queued").length;
  const totalSentCost = tab === "sms"
    ? calculateSmsCost(sentCount).clientPricePLN
    : sentCount * 0.54;
  const perUnitPrice = tab === "sms" ? 0.50 : 0.54;

  function unitLabel(n: number) {
    return tab === "sms" ? `${n} SMS` : `${n} WA`;
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-50 p-0.5 rounded-lg w-fit">
        {(["sms", "whatsapp"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-xs font-medium rounded-md transition ${
              tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}>
            {t === "sms" ? "SMS" : "WhatsApp"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-brand-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Pozostało</p>
          <p className={`text-2xl font-bold ${(tab === "sms" ? smsRemaining : waRemaining) < 10 ? "text-red-500" : "text-brand-500"}`}>
            {tab === "sms" ? smsRemaining : waRemaining}
          </p>
          <p className="text-[10px] text-zinc-400">z {tab === "sms" ? smsTotal : waTotal}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Wysłane</p>
          <p className="text-2xl font-bold text-green-600">{sentCount}</p>
          <p className="text-[10px] text-zinc-400">{unitLabel(sentCount)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Błędy</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          <p className="text-[10px] text-zinc-400">{unitLabel(failedCount)}</p>
        </div>
        <div className="bg-zinc-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Koszt</p>
          <p className="text-2xl font-bold text-zinc-900">{totalSentCost.toFixed(2).replace(".", ",")} zł</p>
          <p className="text-[10px] text-zinc-400">{perUnitPrice.toFixed(2).replace(".", ",")} zł/{tab === "sms" ? "SMS" : "msg"}</p>
        </div>
      </div>

      {/* Progress bar */}
      {(tab === "sms" ? smsTotal : waTotal) > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-500">Wykorzystanie limitu</span>
            <span className="font-medium text-zinc-800">
              {tab === "sms" ? bizData?.sms_used : bizData?.wa_used} / {tab === "sms" ? smsTotal : waTotal}
            </span>
          </div>
          <div className="bg-zinc-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (tab === "sms" ? smsRemaining : waRemaining) < 10 ? "bg-red-500"
                : (tab === "sms" ? smsRemaining : waRemaining) < (tab === "sms" ? smsTotal : waTotal) * 0.2 ? "bg-amber-500"
                : "bg-brand-400"
              }`}
              style={{ width: `${(tab === "sms" ? smsTotal : waTotal) > 0
                ? Math.min(100, (((tab === "sms" ? bizData?.sms_used : bizData?.wa_used) || 0) / (tab === "sms" ? smsTotal : waTotal)) * 100)
                : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Costs breakdown */}
      <div className="bg-zinc-50 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
        <div className="flex justify-between"><span>Koszt Twilio (nasz)</span><span>{(sentCount * TWILIO_SMS_COST_PLN).toFixed(2).replace(".", ",")} zł</span></div>
        <div className="flex justify-between"><span>Cena dla klienta</span><span className="font-medium text-zinc-700">{totalSentCost.toFixed(2).replace(".", ",")} zł</span></div>
        <div className="flex justify-between border-t border-zinc-200 pt-1"><span className="font-medium text-brand-600">Nasza marża</span><span className="font-medium text-brand-600">{(totalSentCost - sentCount * TWILIO_SMS_COST_PLN).toFixed(2).replace(".", ",")} zł</span></div>
      </div>

      {/* Buy more link */}
      <a href="/dashboard?tab=costs"
        className="block w-full text-center bg-brand-400 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-500 transition">
        {tab === "sms" ? "Dokup pakiet SMS →" : "Kontakt w sprawie WhatsApp →"}
      </a>

      {/* History */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {tab === "sms" ? "Wysłane SMS-y" : "Wysłane WhatsApp"} ({activeLogs.length})
        </p>
        {activeLogs.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">Brak wysłanych {tab === "sms" ? "SMS-ów" : "WhatsApp"}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {tab === "sms"
                ? "SMS-y są wysyłane automatycznie po rozmowach z asystentem AI"
                : "WhatsApp jest wysyłany przez agenta podczas rozmowy"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-zinc-100 p-4 space-y-2 hover:border-zinc-200 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500">{log.to_number}</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] || "bg-zinc-50 text-zinc-600"}`}>
                      {statusLabels[log.status] || log.status}
                    </span>
                    {/* Per-message cost */}
                    <span className="text-[10px] text-zinc-400">{perUnitPrice.toFixed(2).replace(".", ",")} zł</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap line-clamp-3">{log.message_body}</p>
                <p className="text-[10px] text-zinc-400">
                  {log.sent_at
                    ? new Date(log.sent_at).toLocaleString("pl-PL")
                    : new Date(log.created_at).toLocaleString("pl-PL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
