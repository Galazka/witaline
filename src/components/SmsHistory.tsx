"use client";

import { useEffect, useState } from "react";
import {
  SMS_PACKAGES, TWILIO_SMS_COST_PLN,
  getSmsRemaining, formatSmsCost, calculateSmsCost,
} from "@/lib/sms-pricing";

interface SmsLog {
  id: string;
  to_number: string;
  message_body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  cost_pln?: number;
  error_message?: string;
}

interface BizData {
  sms_used: number;
  sms_limit: number;
  sms_extra_purchased: number;
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
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [bizData, setBizData] = useState<BizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/business/sms-logs?businessId=${businessId}`).then(r => r.json()),
      fetch(`/api/business/sms/status?businessId=${businessId}`).then(r => r.json()),
    ]).then(([smsData, statusData]) => {
      setLogs(Array.isArray(smsData) ? smsData : []);
      setBizData(statusData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-center text-zinc-400 py-8 text-sm">Ładowanie...</p>;

  const smsRemaining = bizData ? getSmsRemaining(bizData) : 0;
  const smsTotal = bizData ? (bizData.sms_limit || 0) + (bizData.sms_extra_purchased || 0) : 0;

  const sentCount = logs.filter(l => l.status === "sent" || l.status === "delivered").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const pendingCount = logs.filter(l => l.status === "pending" || l.status === "queued").length;
  const { clientPricePLN: totalSentCost } = calculateSmsCost(sentCount);
  const perUnitPrice = SMS_PACKAGES[0].pricePerSmsPLN;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-brand-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Pozostało</p>
          <p className={`text-2xl font-bold ${smsRemaining < 10 ? "text-red-500" : "text-brand-500"}`}>{smsRemaining}</p>
          <p className="text-[10px] text-zinc-400">z {smsTotal}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Wysłane</p>
          <p className="text-2xl font-bold text-green-600">{sentCount}</p>
          <p className="text-[10px] text-zinc-400">{sentCount} SMS</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Błędy</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          <p className="text-[10px] text-zinc-400">{failedCount} SMS</p>
        </div>
        <div className="bg-zinc-50 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Koszt</p>
          <p className="text-2xl font-bold text-zinc-900">{totalSentCost.toFixed(2).replace(".", ",")} zł</p>
          <p className="text-[10px] text-zinc-400">{perUnitPrice.toFixed(2).replace(".", ",")} zł/SMS</p>
        </div>
      </div>

      {/* Progress bar */}
      {smsTotal > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-500">Wykorzystanie limitu</span>
            <span className="font-medium text-zinc-800">{bizData?.sms_used} / {smsTotal}</span>
          </div>
          <div className="bg-zinc-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                smsRemaining < 10 ? "bg-red-500"
                : smsRemaining < smsTotal * 0.2 ? "bg-amber-500"
                : "bg-brand-400"
              }`}
              style={{ width: `${smsTotal > 0 ? Math.min(100, (((bizData?.sms_used || 0) / smsTotal) * 100)) : 0}%` }}
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
        Dokup pakiet SMS →
      </a>

      {/* History */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Wysłane SMS-y ({logs.length})</p>
{logs.length === 0 ? (
           <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
             <p className="text-sm text-zinc-400">Brak wysłanych SMS-ów</p>
             <p className="text-xs text-zinc-400 mt-1">SMS-y są wysyłane automatycznie po rozmowach z asystentem AI</p>
           </div>
         ) : (
           <div className="space-y-2">
             {/* Search/filter */}
             <input
               type="text"
               placeholder="Szukaj po numerze lub treści..."
               onChange={e => {
                 const query = e.target.value.toLowerCase();
                 const filtered = (document.querySelectorAll("[data-sms-row]") as NodeListOf<HTMLElement>);
                 filtered.forEach(row => {
                   const text = row.textContent?.toLowerCase() || "";
                   row.style.display = text.includes(query) ? "" : "none";
                 });
               }}
               className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm mb-2"
             />
             {logs.map(log => (
               <div key={log.id} data-sms-row className="bg-white rounded-xl border border-zinc-100 p-4 space-y-2 hover:border-zinc-200 transition">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-mono text-zinc-500">{log.to_number}</span>
                   <div className="flex items-center gap-2">
                     <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status] || "bg-zinc-50 text-zinc-600"}`}>
                       {statusLabels[log.status] || log.status}
                     </span>
                     <span className="text-[10px] text-zinc-400">{perUnitPrice.toFixed(2).replace(".", ",")} zł</span>
                     {log.status === "failed" && (
                       <button
                         onClick={async () => {
                           const res = await fetch("/api/sms/retry", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ logId: log.id }),
                           });
                           if (res.ok) fetch(`/api/business/sms-logs?businessId=${businessId}`).then(r => r.json()).then(setLogs);
                         }}
                         className="text-[10px] text-brand-500 hover:text-brand-600 underline"
                       >Ponów</button>
                     )}
                   </div>
                 </div>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap line-clamp-3">{log.message_body}</p>
                  {log.status === "failed" && log.error_message && (
                    <p className="text-[11px] text-red-500 mt-1">{log.error_message}</p>
                  )}
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
