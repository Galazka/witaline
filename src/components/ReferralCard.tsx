"use client";

import { useState, useEffect } from "react";
import { WITALINE_CONTACT_EMAIL } from "@/lib/constants";

interface ReferralInfo {
  code: string;
  referralLink: string;
  referrals: { id: string; status: string; created_at: string; referred_business?: { name?: string } }[];
  coupons: { id: string; code: string; discount_percent: number; used: boolean; used_at: string | null; expires_at: string }[];
  businessName: string;
}

export default function ReferralCard({ businessId }: { businessId: string }) {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(setInfo)
      .catch(console.error);
  }, []);

  function copyLink() {
    if (!info?.referralLink) return;
    navigator.clipboard.writeText(info.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!info) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  const activeCoupons = info.coupons.filter(c => !c.used && new Date(c.expires_at) > new Date());

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Program poleceń</h3>
      <p className="text-sm text-zinc-500 mb-4">
        Poleć WitaLine innym firmom. Ty i zaproszona firma otrzymacie <strong>kupon 20% rabatu</strong> na następne doładowanie!
      </p>

      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <p className="text-xs font-medium text-green-700 mb-1">Twój kod polecenia</p>
        <p className="text-2xl font-bold text-green-800 tracking-wider mb-2">{info.code}</p>
        <p className="text-xs text-green-600 break-all">{info.referralLink}</p>
      </div>

      <button
        onClick={copyLink}
        className="w-full bg-[#0d9488] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
      >
        {copied ? "Skopiowano!" : "Skopiuj link polecenia"}
      </button>

      {activeCoupons.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Twoje kupon rabatowy</h4>
          <div className="space-y-2">
            {activeCoupons.map((c) => (
              <div key={c.id} className="bg-gradient-to-r from-[#f0fdfa] to-[#ccfbf1] border border-[#0d9488]/20 rounded-lg p-4">
                <p className="text-lg font-bold text-brand-700 tracking-wider">{c.code}</p>
                <p className="text-sm text-[#0d9488] mt-1">{c.discount_percent}% rabatu na następne doładowanie</p>
                <p className="text-xs text-zinc-400 mt-1">Ważny do {new Date(c.expires_at).toLocaleDateString("pl-PL")}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">Użyj kodu przy zakupie pakietu minut w zakładce "Doładowanie". Rabat zostanie naliczony automatycznie.</p>
        </div>
      )}

      {info.referrals.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Historia poleceń</h4>
          <div className="space-y-2">
            {info.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-3 bg-zinc-50 rounded-lg">
                <div>
                  <p className="text-zinc-700">{r.referred_business?.name || "Firma"}</p>
                  <p className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString("pl-PL")}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  Kupon wysłany
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400 mt-4">Masz pytania? Napisz na {WITALINE_CONTACT_EMAIL}</p>
    </div>
  );
}
