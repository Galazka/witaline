"use client";

import { useState, useEffect } from "react";
import { getSmsRemaining, SMS_PACKAGES } from "@/lib/sms-pricing";

interface Props {
  businessId: string;
}

export default function SmsStatusWidget({ businessId }: Props) {
  const [data, setData] = useState<{
    sms_limit: number; sms_used: number; sms_extra_purchased: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/business/sms/status?businessId=${businessId}`)
      .then(r => r.json())
      .then(setData)
      .catch((e) => console.error("[SmsStatusWidget] fetch error:", e))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading || !data) return null;

  const smsRemaining = getSmsRemaining(data);
  const smsTotal = (data.sms_limit || 0) + (data.sms_extra_purchased || 0);
  const usagePercent = smsTotal > 0 ? Math.round(((data.sms_used || 0) / smsTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-4 space-y-3">
      <p className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        SMS
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600">SMS</span>
        <div className="text-right">
          <span className={`text-lg font-bold ${smsRemaining < 10 ? "text-red-500" : "text-[#0d9488]"}`}>{smsRemaining}</span>
          <span className="text-xs text-zinc-400 ml-1">/ {smsTotal}</span>
        </div>
      </div>

      {smsTotal > 0 && (
        <div className="w-full h-1.5 bg-brand-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-[#0d9488]"}`}
            style={{ width: `${Math.min(100, usagePercent)}%` }} />
        </div>
      )}

      <a href="/dashboard?tab=sms"
        className="block w-full text-center bg-[#f0fdfa] text-[#0d9488] py-2 rounded-lg text-xs font-medium hover:bg-[#ccfbf1] transition mt-1">
        Zarządzaj SMS → Dokup pakiet
      </a>
    </div>
  );
}