"use client";

import { useEffect, useState } from "react";
import type { Coupon, DiscountRule } from "@/types/database";
import { getPlanLabel } from "@/lib/pricing";

export default function AdminCouponsPanel() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [showNewDiscount, setShowNewDiscount] = useState(false);

  // New coupon form
  const [couponCode, setCouponCode] = useState("");
  const [couponDesc, setCouponDesc] = useState("");
  const [couponPercent, setCouponPercent] = useState("");
  const [couponAmount, setCouponAmount] = useState("");
  const [couponMaxUses, setCouponMaxUses] = useState("");
  const [couponValidUntil, setCouponValidUntil] = useState("");
  const [couponPlans, setCouponPlans] = useState<string[]>([]);

  // New discount form
  const [discName, setDiscName] = useState("");
  const [discDesc, setDiscDesc] = useState("");
  const [discPercent, setDiscPercent] = useState("");
  const [discAmount, setDiscAmount] = useState("");
  const [discStart, setDiscStart] = useState("");
  const [discEnd, setDiscEnd] = useState("");
  const [discMaxUses, setDiscMaxUses] = useState("");
  const [discPlans, setDiscPlans] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [cRes, dRes] = await Promise.all([
      fetch("/api/admin/coupons"),
      fetch("/api/admin/discounts"),
    ]);
    if (cRes.ok) setCoupons(await cRes.json());
    if (dRes.ok) setDiscounts(await dRes.json());
    setLoading(false);
  }

  async function handleCreateCoupon() {
    if (!couponCode) return;
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode,
        description: couponDesc,
        discount_percent: couponPercent ? Number(couponPercent) : null,
        discount_amount: couponAmount ? Number(couponAmount) : null,
        max_uses: couponMaxUses ? Number(couponMaxUses) : 0,
        valid_until: couponValidUntil || null,
        applicable_plans: couponPlans,
      }),
    });
    if (res.ok) {
      setMessage("Kupon utworzony!");
      setShowNewCoupon(false);
      resetCouponForm();
      fetchData();
    } else {
      const err = await res.json();
      setMessage(err.error || "Błąd tworzenia kuponu");
    }
    setSaving(false);
  }

  async function handleToggleCoupon(id: string, active: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchData();
  }

  async function handleCreateDiscount() {
    if (!discName || !discStart || !discEnd) return;
    setSaving(true);
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: discName,
        description: discDesc,
        discount_percent: discPercent ? Number(discPercent) : null,
        discount_amount: discAmount ? Number(discAmount) : null,
        target_plans: discPlans,
        start_at: discStart,
        end_at: discEnd,
        max_uses_total: discMaxUses ? Number(discMaxUses) : 0,
      }),
    });
    if (res.ok) {
      setMessage("Reguła zniżek utworzona!");
      setShowNewDiscount(false);
      resetDiscountForm();
      fetchData();
    } else {
      const err = await res.json();
      setMessage(err.error || "Błąd tworzenia reguły");
    }
    setSaving(false);
  }

  async function handleToggleDiscount(id: string, active: boolean) {
    await fetch("/api/admin/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchData();
  }

  function resetCouponForm() {
    setCouponCode(""); setCouponDesc(""); setCouponPercent(""); setCouponAmount("");
    setCouponMaxUses(""); setCouponValidUntil(""); setCouponPlans([]);
  }

  function resetDiscountForm() {
    setDiscName(""); setDiscDesc(""); setDiscPercent(""); setDiscAmount("");
    setDiscStart(""); setDiscEnd(""); setDiscMaxUses(""); setDiscPlans([]);
  }

  function togglePlan(plan: string, plans: string[], setPlans: (p: string[]) => void) {
    setPlans(plans.includes(plan) ? plans.filter(p => p !== plan) : [...plans, plan]);
  }

  const planOptions = ["elastic_0", "enterprise_2000"];

  if (loading) return <p className="text-zinc-400 text-sm">Ładowanie...</p>;

  return (
    <div className="space-y-8">
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes("Błąd") ? "bg-red-50 text-red-600" : "bg-[#f0fdfa] text-[#0d9488]"}`}>
          {message}
        </div>
      )}

      {/* Coupons section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">Kupony rabatowe</h3>
          <button
            onClick={() => setShowNewCoupon(!showNewCoupon)}
            className="bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
          >
            {showNewCoupon ? "Anuluj" : "+ Nowy kupon"}
          </button>
        </div>

        {showNewCoupon && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Kod kuponu *</label>
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="np. PROMO50"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm uppercase" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Opis</label>
                <input value={couponDesc} onChange={e => setCouponDesc(e.target.value)} placeholder="np. 50% na start"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Zniżka %</label>
                <input type="number" value={couponPercent} onChange={e => setCouponPercent(e.target.value)} placeholder="50"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" min="1" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Zniżka (PLN)</label>
                <input type="number" value={couponAmount} onChange={e => setCouponAmount(e.target.value)} placeholder="20"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" min="1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Max użyć (0 = bez limitu)</label>
                <input type="number" value={couponMaxUses} onChange={e => setCouponMaxUses(e.target.value)} placeholder="100"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Ważny do</label>
                <input type="datetime-local" value={couponValidUntil} onChange={e => setCouponValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Dotyczy planów (puste = wszystkie)</label>
              <div className="flex gap-2">
                {planOptions.map(p => (
                  <button key={p} onClick={() => togglePlan(p, couponPlans, setCouponPlans)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      couponPlans.includes(p) ? "bg-brand-100 border-[#0d9488] text-[#0d9488]" : "border-zinc-200 text-zinc-500 hover:bg-[#f0fdfa]"
                    }`}>
                    {getPlanLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateCoupon} disabled={saving || !couponCode}
              className="bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50">
              {saving ? "Tworzenie..." : "Utwórz kupon"}
            </button>
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">Brak kuponów. Utwórz pierwszy kupon powyżej.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kod</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Zniżka</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Użyte</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ważny do</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plany</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Akcja</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-[#f0fdfa] transition">
                    <td className="px-4 py-3 font-mono font-bold text-zinc-900">{c.code}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {c.discount_percent ? `${c.discount_percent}%` : c.discount_amount ? `${c.discount_amount} zł` : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{c.used_count} / {c.max_uses || "∞"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString("pl-PL") : "Bezterminowo"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {c.applicable_plans?.length ? c.applicable_plans.join(", ") : "Wszystkie"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.active ? "bg-[#ccfbf1] text-[#0d9488]" : "bg-brand-50 text-zinc-500"
                      }`}>
                        {c.active ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleCoupon(c.id, c.active)}
                        className={`text-xs font-medium ${c.active ? "text-red-500" : "text-[#0d9488]"} hover:underline`}>
                        {c.active ? "Dezaktywuj" : "Aktywuj"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-discount rules section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">Automatyczne zniżki czasowe</h3>
          <button
            onClick={() => setShowNewDiscount(!showNewDiscount)}
            className="bg-[#0d9488] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
          >
            {showNewDiscount ? "Anuluj" : "+ Nowa reguła"}
          </button>
        </div>

        {showNewDiscount && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Nazwa reguły *</label>
                <input value={discName} onChange={e => setDiscName(e.target.value)} placeholder="np. Promocja letnia"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Opis</label>
                <input value={discDesc} onChange={e => setDiscDesc(e.target.value)} placeholder="np. -30% na lato"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Zniżka %</label>
                <input type="number" value={discPercent} onChange={e => setDiscPercent(e.target.value)} placeholder="30"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" min="1" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Zniżka (PLN)</label>
                <input type="number" value={discAmount} onChange={e => setDiscAmount(e.target.value)} placeholder="50"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" min="1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Start *</label>
                <input type="datetime-local" value={discStart} onChange={e => setDiscStart(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Koniec *</label>
                <input type="datetime-local" value={discEnd} onChange={e => setDiscEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Max użyć (0 = bez limitu)</label>
                <input type="number" value={discMaxUses} onChange={e => setDiscMaxUses(e.target.value)} placeholder="500"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Dotyczy planów (puste = wszystkie)</label>
              <div className="flex gap-2">
                {planOptions.map(p => (
                  <button key={p} onClick={() => togglePlan(p, discPlans, setDiscPlans)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      discPlans.includes(p) ? "bg-brand-100 border-[#0d9488] text-[#0d9488]" : "border-zinc-200 text-zinc-500 hover:bg-[#f0fdfa]"
                    }`}>
                    {getPlanLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateDiscount} disabled={saving || !discName || !discStart || !discEnd}
              className="bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50">
              {saving ? "Tworzenie..." : "Utwórz regułę"}
            </button>
          </div>
        )}

        {discounts.length === 0 ? (
          <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">Brak reguł zniżek. Utwórz pierwszą regułę, aby automatycznie obniżać ceny w określonym czasie.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nazwa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Zniżka</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Okres</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Użyte</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plany</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Akcja</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => {
                  const now = new Date();
                  const isActive = d.active && new Date(d.start_at) <= now && new Date(d.end_at) >= now;
                  return (
                    <tr key={d.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-[#f0fdfa] transition">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.name}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {d.discount_percent ? `${d.discount_percent}%` : d.discount_amount ? `${d.discount_amount} zł` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(d.start_at).toLocaleDateString("pl-PL")} — {new Date(d.end_at).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{d.used_count} / {d.max_uses_total || "∞"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {d.target_plans?.length ? d.target_plans.join(", ") : "Wszystkie"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive ? "bg-[#ccfbf1] text-[#0d9488]" :
                          d.active ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-zinc-500"
                        }`}>
                          {isActive ? "Aktywna" : d.active ? "Zaplanowana" : "Nieaktywna"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleDiscount(d.id, d.active)}
                          className={`text-xs font-medium ${d.active ? "text-red-500" : "text-[#0d9488]"} hover:underline`}>
                          {d.active ? "Dezaktywuj" : "Aktywuj"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
