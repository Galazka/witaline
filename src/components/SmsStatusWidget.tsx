"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
}

export default function SmsStatusWidget({ businessId }: Props) {
  const [data, setData] = useState<{
    limit: number; used: number; remaining: number; usagePercent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/business/sms/status?businessId=${businessId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return null;
  if (!data) return null;

  const remaining = data.remaining;

  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-xs text-zinc-400 uppercase tracking-wider">Dostepne SMS</p>
      <p className={`text-2xl font-bold ${remaining < 10 ? "text-red-500" : "text-brand-400"}`}>{remaining}</p>
      <p className="text-xs text-zinc-400">z {data.limit + data.used + (remaining)} lacznie</p>
      {data.usagePercent > 0 && (
        <div className="w-full h-1.5 bg-brand-100 rounded-full mt-2">
          <div
            className={`h-full rounded-full ${data.usagePercent > 80 ? "bg-red-500" : data.usagePercent > 50 ? "bg-amber-500" : "bg-brand-400"}`}
            style={{ width: `${Math.min(100, data.usagePercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}
