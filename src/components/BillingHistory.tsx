"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  metadata: Record<string, string>;
  invoice_url?: string;
  receipt_url?: string;
}

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string;
  plan: string;
  amount: number;
}

export default function BillingHistory({ businessId }: { businessId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnUrl, setReturnUrl] = useState("");

  useEffect(() => {
    setReturnUrl(window.location.href);
    Promise.all([
      fetch(`/api/stripe/status?businessId=${businessId}`).then(r => r.json()),
      fetch(`/api/business/billing?businessId=${businessId}`).then(r => r.json().catch(() => [])),
    ]).then(([subData, paymentData]) => {
      setSubscription(subData);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-center text-zinc-400 py-8 text-sm">Ładowanie...</p>;

  return (
    <div className="space-y-6">
      {/* Current subscription */}
      {subscription && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Aktualna subskrypcja</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase text-zinc-400 tracking-wider">Status</p>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${
                subscription.status === "active" ? "bg-green-100 text-green-700"
                : subscription.status === "past_due" ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-700"
              }`}>
                {subscription.status === "active" ? "Aktywna"
                  : subscription.status === "past_due" ? "Zaległa"
                  : subscription.status === "trialing" ? "Próbna"
                  : subscription.status === "canceled" ? "Anulowana"
                  : subscription.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-400 tracking-wider">Plan</p>
              <p className="text-lg font-bold text-zinc-900 mt-1">{subscription.plan || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-400 tracking-wider">Kwota</p>
              <p className="text-lg font-bold text-brand-500 mt-1">
                {(subscription.amount / 100).toFixed(2).replace(".", ",")} PLN
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-400 tracking-wider">Koniec okresu</p>
              <p className="text-sm font-medium text-zinc-700 mt-1">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pl-PL")
                  : "—"}
              </p>
            </div>
          </div>
<a href={`/api/stripe/portal?businessId=${businessId}`} className="mt-4 inline-block text-xs text-brand-500 hover:text-brand-600 transition">
             Zarządzaj subskrypcją w Stripe →
           </a>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Historia płatności</h3>
        {payments.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center">
            <p className="text-sm text-zinc-400">Brak płatności</p>
            <p className="text-xs text-zinc-400 mt-1">Historia pojawi się po pierwszej udanej płatności</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 text-xs border-b border-zinc-100">
                  <th className="pb-3 pr-4 font-medium">Data</th>
                  <th className="pb-3 pr-4 font-medium">Opis</th>
                  <th className="pb-3 pr-4 font-medium">Kwota</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                    <td className="py-3 pr-4 text-zinc-600">
                      {new Date(p.created * 1000).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="py-3 pr-4 text-zinc-800">{p.description || "Płatność"}</td>
                    <td className="py-3 pr-4 font-medium">
                      {(p.amount / 100).toFixed(2).replace(".", ",")} {p.currency.toUpperCase()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "succeeded" || p.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : p.status === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status === "succeeded" || p.status === "paid" ? "Opłacono"
                          : p.status === "failed" ? "Błąd"
                          : p.status === "refunded" ? "Zwrócono"
                          : p.status === "pending" ? "Oczekuje"
                          : p.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {p.receipt_url && (
                        <a href={p.receipt_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-500 hover:text-brand-600 transition">
                          Paragon →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer portal link */}
      <a
        href={`/api/stripe/portal?businessId=${businessId}&returnUrl=${encodeURIComponent(returnUrl || window.location.href)}`}
        className="block w-full text-center bg-brand-400 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-500 transition"
      >
        Panel zarządzania płatnościami (Stripe) →
      </a>
    </div>
  );
}