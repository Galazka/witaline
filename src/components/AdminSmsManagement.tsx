"use client";

import { useState, useEffect } from "react";

interface BizSmsUsage {
  id: string;
  name: string;
  smsLimit: number;
  smsExtra: number;
  smsUsed: number;
  totalCapacity: number;
  remaining: number;
  usagePercent: number;
  suspended: boolean;
}

export default function AdminSmsManagement() {
  const [data, setData] = useState<BizSmsUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState(0);
  const [editExtra, setEditExtra] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { fetchUsage(); }, []);

  async function fetchUsage() {
    setLoading(true);
    const res = await fetch("/api/admin/sms/usage");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  async function handleSave(id: string) {
    setEditingId(null);
    const res = await fetch("/api/admin/sms/limits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: id, sms_limit: editLimit, sms_extra_purchased: editExtra }),
    });
    if (res.ok) {
      setToast({ msg: "Zapisano limity SMS", ok: true });
      fetchUsage();
    } else {
      setToast({ msg: "Błąd zapisu", ok: false });
    }
  }

  function startEdit(b: BizSmsUsage) {
    setEditingId(b.id);
    setEditLimit(b.smsLimit);
    setEditExtra(b.smsExtra);
  }

  if (loading) {
    return <p className="text-sm text-zinc-400 text-center py-8">Ładowanie...</p>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <p className={`px-4 py-3 rounded-xl text-sm ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {toast.msg}
        </p>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Zużycie SMS</h3>
        <button
          onClick={fetchUsage}
          className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition"
        >
          Odśwież
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 text-xs border-b border-zinc-200">
              <th className="pb-3 pr-4 font-medium">Firma</th>
              <th className="pb-3 pr-4 font-medium">Limit</th>
              <th className="pb-3 pr-4 font-medium">Dodatkowe</th>
              <th className="pb-3 pr-4 font-medium">Użyte</th>
              <th className="pb-3 pr-4 font-medium">Pozostało</th>
              <th className="pb-3 pr-4 font-medium">Zużycie</th>
              <th className="pb-3 pr-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-zinc-400">Brak firm z konfiguracją SMS</td></tr>
            ) : (
              data.map(b => (
                <tr key={b.id} className="border-b border-zinc-100 hover:bg-brand-50 transition">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{b.name}</span>
                      {b.suspended && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Zawieszona</span>}
                    </div>
                  </td>
                  {editingId === b.id ? (
                    <>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={0}
                          value={editLimit}
                          onChange={(e) => setEditLimit(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-zinc-200 rounded text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={0}
                          value={editExtra}
                          onChange={(e) => setEditExtra(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-zinc-200 rounded text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4 text-zinc-700">{b.smsUsed}</td>
                      <td className="py-3 pr-4 text-zinc-700">{Math.max(0, editLimit + editExtra - b.smsUsed)}</td>
                      <td className="py-3 pr-4">
                        <div className="w-24 bg-brand-50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${b.usagePercent > 80 ? "bg-red-500" : b.usagePercent > 50 ? "bg-amber-500" : "bg-brand-400"}`}
                            style={{ width: `${Math.min(100, b.usagePercent)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSave(b.id)}
                            className="px-2.5 py-1 bg-brand-400 text-white text-[11px] font-medium rounded-lg hover:bg-brand-500 transition"
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 transition"
                          >
                            Anuluj
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 pr-4 text-zinc-700">{b.smsLimit}</td>
                      <td className="py-3 pr-4 text-zinc-700">+{b.smsExtra}</td>
                      <td className="py-3 pr-4 text-zinc-700">{b.smsUsed}</td>
                      <td className="py-3 pr-4">
                        <span className={`font-medium ${b.remaining < 10 ? "text-red-600" : "text-zinc-700"}`}>
                          {b.remaining}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-brand-50 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${b.usagePercent > 80 ? "bg-red-500" : b.usagePercent > 50 ? "bg-amber-500" : "bg-brand-400"}`}
                              style={{ width: `${Math.min(100, b.usagePercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-zinc-400">{b.usagePercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => startEdit(b)}
                          className="px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition"
                        >
                          Edytuj
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl p-4 text-xs text-zinc-500 space-y-1">
        <p><strong>📋 Jak działa limit SMS:</strong></p>
        <p>Każda firma ma {`limit (sms_limit)`} + {`dodatkowe (sms_extra_purchased)`} SMS-ów do wykorzystania.</p>
        <p>Gdy licznik {`(sms_used)`} osiągnie sumę, SMS-y przestają być wysyłane — w logu pojawi się błąd "Limit SMS wyczerpany".</p>
        <p>Możesz edytować limit (stały z planu) lub dodać dodatkowe SMS-y (np. po zakupie).</p>
      </div>
    </div>
  );
}
