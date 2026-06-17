"use client";

import { useState, useEffect, useCallback } from "react";

interface PhoneGroup {
  phoneNumber: string;
  businessName: string;
  totalCalls: number;
  totalDuration: number;
  totalCost: number;
  handoffAttempts: number;
  handoffSuccess: number;
  lastCall: string;
}

export default function AdminPhoneStats() {
  const [groups, setGroups] = useState<PhoneGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/phone-stats");
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <p className="text-sm text-zinc-400">Ładowanie statystyk...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">Łącznie: <strong>{total}</strong> połączeń na <strong>{groups.length}</strong> numerach</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="text-left py-2 pr-3 font-medium">Numer</th>
              <th className="text-left py-2 pr-3 font-medium">Firma</th>
              <th className="text-right py-2 pr-3 font-medium">Połączenia</th>
              <th className="text-right py-2 pr-3 font-medium">Czas (min)</th>
              <th className="text-right py-2 pr-3 font-medium">Koszt (PLN)</th>
              <th className="text-right py-2 pr-3 font-medium">Handoff</th>
              <th className="text-right py-2 pr-3 font-medium">Udane</th>
              <th className="text-right py-2 font-medium">Ostatnie</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.phoneNumber} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 pr-3 font-mono font-medium text-zinc-900">{g.phoneNumber}</td>
                <td className="py-2 pr-3 text-zinc-600">{g.businessName}</td>
                <td className="py-2 pr-3 text-right text-zinc-900">{g.totalCalls}</td>
                <td className="py-2 pr-3 text-right text-zinc-600">{Math.round(g.totalDuration / 60)}</td>
                <td className="py-2 pr-3 text-right text-zinc-600">{g.totalCost.toFixed(2)}</td>
                <td className="py-2 pr-3 text-right text-zinc-600">{g.handoffAttempts}</td>
                <td className="py-2 pr-3 text-right text-green-600">{g.handoffSuccess}</td>
                <td className="py-2 text-right text-zinc-400">{new Date(g.lastCall).toLocaleDateString("pl-PL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-zinc-400 italic">Brak danych.</p>
      )}
    </div>
  );
}