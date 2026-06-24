"use client";

import { useState, useEffect } from "react";
import {
  SMS_PACKAGES, DEFAULT_SMS_MARKUP_PERCENT,
  TWILIO_SMS_COST_PLN, formatSmsCost
} from "@/lib/sms-pricing";

interface BizSmsUsage {
  id: string;
  name: string;
  smsLimit: number;
  smsExtra: number;
  smsUsed: number;
  totalCapacity: number;
  remaining: number;
  usagePercent: number;
  smsEnabled: boolean;
  suspended: boolean;
}

export default function AdminSmsManagement() {
  const [tab, setTab] = useState<"usage" | "pricing">("usage");
  const [data, setData] = useState<BizSmsUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState(0);
  const [editExtra, setEditExtra] = useState(0);
  const [editEnabled, setEditEnabled] = useState(true);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { fetchUsage(); }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
  }

  async function fetchUsage() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sms/pricing-config");
      if (res.ok) {
        const json = await res.json();
        setData(json.businesses || []);
      }
    } catch { showToast("Błąd sieci", false); }
    setLoading(false);
  }

  async function handleSave(id: string) {
    setEditingId(null);
    const res = await fetch("/api/admin/sms/pricing-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_limits",
        business_id: id,
        sms_limit: editLimit,
        sms_extra_purchased: editExtra,
        sms_enabled: editEnabled,
      }),
    });
    if (res.ok) {
      showToast("Zapisano", true);
      fetchUsage();
    } else {
      showToast("Błąd zapisu", false);
    }
  }

  async function handleToggleAll(enabled: boolean) {
    const res = await fetch("/api/admin/sms/pricing-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_all", enabled }),
    });
    if (res.ok) {
      showToast(enabled ? "SMS włączone dla wszystkich firm" : "SMS wyłączone dla wszystkich firm", true);
      fetchUsage();
    } else {
      showToast("Błąd", false);
    }
  }

  function startEdit(b: BizSmsUsage) {
    setEditingId(b.id);
    setEditLimit(b.smsLimit);
    setEditExtra(b.smsExtra);
    setEditEnabled(b.smsEnabled);
  }

  const totalRemaining = data.reduce((sum, b) => sum + b.remaining, 0);
  const totalCapacity = data.reduce((sum, b) => sum + b.totalCapacity, 0);
  const enabledCount = data.filter(b => b.smsEnabled).length;

  return (
    <div className="space-y-4">
      {toast && (
        <p className={`px-4 py-3 rounded-xl text-sm ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {toast.msg}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-50 p-0.5 rounded-lg w-fit">
        <button onClick={() => setTab("usage")}
          className={`px-4 py-2 text-xs font-medium rounded-md transition ${tab === "usage" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
          Zużycie SMS
        </button>
        <button onClick={() => setTab("pricing")}
          className={`px-4 py-2 text-xs font-medium rounded-md transition ${tab === "pricing" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
          Cennik i marże
        </button>
      </div>

      {tab === "usage" && (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Firmy z SMS</p>
              <p className="text-xl font-bold text-brand-500">{enabledCount}/{data.length}</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Pozostało</p>
              <p className="text-xl font-bold text-brand-500">{totalRemaining}</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Łączny limit</p>
              <p className="text-xl font-bold text-brand-500">{totalCapacity}</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Koszt Twilio/SMS</p>
              <p className="text-xl font-bold text-brand-500">{TWILIO_SMS_COST_PLN.toFixed(2).replace(".", ",")} zł</p>
            </div>
          </div>

          {/* Mass toggle */}
          <div className="flex gap-2">
            <button onClick={() => handleToggleAll(true)}
              className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
              Włącz SMS dla wszystkich
            </button>
            <button onClick={() => handleToggleAll(false)}
              className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
              Wyłącz SMS dla wszystkich
            </button>
            <button onClick={fetchUsage}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition ml-auto">
              Odśwież
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 text-xs border-b border-zinc-200">
                  <th className="pb-3 pr-4 font-medium">Firma</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
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
                  <tr><td colSpan={8} className="text-center py-8 text-zinc-400">Brak firm z konfiguracją SMS</td></tr>
                ) : (
                  data.map(b => (
                    <tr key={b.id} className="border-b border-zinc-100 hover:bg-brand-50 transition">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{b.name}</span>
                          {b.suspended && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Zawieszona</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${b.smsEnabled ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {b.smsEnabled ? "AKTYWNY" : "WYŁ."}
                        </span>
                      </td>
                      {editingId === b.id ? (
                        <>
                          <td className="py-3 pr-4">
                            <input type="number" min={0} value={editLimit}
                              onChange={e => setEditLimit(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-zinc-200 rounded text-sm" />
                          </td>
                          <td className="py-3 pr-4">
                            <input type="number" min={0} value={editExtra}
                              onChange={e => setEditExtra(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-zinc-200 rounded text-sm" />
                          </td>
                          <td className="py-3 pr-4 text-zinc-700">{b.smsUsed}</td>
                          <td className="py-3 pr-4 text-zinc-700">{Math.max(0, editLimit + editExtra - b.smsUsed)}</td>
                          <td className="py-3 pr-4" />
                          <td className="py-3 pr-2">
                            <div className="flex gap-1">
                              <button onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 transition">Anuluj</button>
                              <button onClick={() => handleSave(b.id)}
                                className="px-2.5 py-1 bg-brand-400 text-white text-[11px] font-medium rounded-lg hover:bg-brand-500 transition">Zapisz</button>
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
                                <div className={`h-2 rounded-full transition-all ${b.usagePercent > 80 ? "bg-red-500" : b.usagePercent > 50 ? "bg-amber-500" : "bg-brand-400"}`}
                                  style={{ width: `${Math.min(100, b.usagePercent)}%` }} />
                              </div>
                              <span className="text-[11px] text-zinc-400">{b.usagePercent}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-2">
                            <button onClick={() => startEdit(b)}
                              className="px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition">
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
        </>
      )}

      {tab === "pricing" && (
        <div className="space-y-6">
          {/* WitaLine koszty */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Koszty WitaLine (Twilio)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider">SMS — koszt Twilio</p>
                <p className="text-2xl font-bold text-zinc-900">{TWILIO_SMS_COST_PLN.toFixed(2).replace(".", ",")} zł</p>
                <p className="text-[10px] text-zinc-400">za segment (Polska)</p>
              </div>
            </div>
          </div>

          {/* Marża i cena klienta */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Marża i cena klienta</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Marża</p>
                <p className="text-2xl font-bold text-brand-500">{DEFAULT_SMS_MARKUP_PERCENT}%</p>
                <p className="text-[10px] text-zinc-400">(100% = 2× kosztu Twilio)</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Cena klienta/SMS</p>
                <p className="text-2xl font-bold text-brand-500">0,50 zł</p>
                <p className="text-[10px] text-zinc-400">zysk: 0,25 zł/SMS</p>
              </div>
            </div>
          </div>

          {/* SMS Pakiety */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Pakiety SMS — ceny dla klienta</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-400 text-xs border-b border-zinc-200">
                    <th className="pb-3 pr-4 font-medium">Pakiet</th>
                    <th className="pb-3 pr-4 font-medium">Cena klienta</th>
                    <th className="pb-3 pr-4 font-medium">Koszt WitaLine</th>
                    <th className="pb-3 pr-4 font-medium">Marża</th>
                    <th className="pb-3 pr-4 font-medium">Cena/SMS</th>
                  </tr>
                </thead>
                <tbody>
                  {SMS_PACKAGES.map(p => (
                    <tr key={p.smsCount} className="border-b border-zinc-100">
                      <td className="py-2 pr-4 font-medium">{p.smsCount} SMS</td>
                      <td className="py-2 pr-4">{p.clientPricePLN.toFixed(2).replace(".", ",")} zł</td>
                      <td className="py-2 pr-4 text-zinc-500">{p.witalineCostPLN.toFixed(2).replace(".", ",")} zł</td>
                      <td className="py-2 pr-4 text-brand-500">{p.marginPLN.toFixed(2).replace(".", ",")} zł</td>
                      <td className="py-2 pr-4">{p.pricePerSmsPLN.toFixed(2).replace(".", ",")} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="bg-zinc-50 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
            <p><strong>Jak działa cennik SMS:</strong></p>
            <p>• Koszt Twilio do Polski: <strong>{TWILIO_SMS_COST_PLN.toFixed(2).replace(".", ",")} zł/SMS</strong> ($0.0457 × kurs ~4.15)</p>
            <p>• Domyślna marża WitaLine: <strong>{DEFAULT_SMS_MARKUP_PERCENT}%</strong> (klient płaci 0,50 zł/SMS)</p>
            <p>• Pakiety SMS są kupowane jednorazowo przez Stripe i dodawane do salda firmy (sms_extra_purchased)</p>
            <p>• Administrator może wyłączyć SMS dla konkretnej firmy lub wszystkich firm naraz</p>
          </div>
        </div>
      )}
    </div>
  );
}