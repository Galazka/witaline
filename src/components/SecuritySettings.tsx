"use client";

import { useState, useEffect } from "react";
import MemberManager from "./MemberManager";
import AuditLog from "./AuditLog";
import VerificationBadge from "./VerificationBadge";
import TwoFactorSettings from "./TwoFactorSettings";

interface Props {
  businessId: string;
  business?: { two_factor_enabled?: boolean };
}

export default function SecuritySettings({ businessId, business }: Props) {
  const [yourRole, setYourRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "audit" | "verification">("members");
  const [twoFaEnabled, setTwoFaEnabled] = useState(business?.two_factor_enabled ?? false);

  useEffect(() => {
    fetch(`/api/business/members?businessId=${businessId}`)
      .then(r => r.json())
      .then(data => {
        setYourRole(data.yourRole || "viewer");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-xs text-zinc-400">Ładowanie...</p>;

  const isOwner = yourRole === "owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Bezpieczeństwo</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-zinc-500">
          Rola: {yourRole === "owner" ? "Właściciel" : yourRole === "admin" ? "Admin" : "Viewer"}
        </span>
      </div>

      {/* Verification */}
      <div className="card-modern p-5">
        <VerificationBadge businessId={businessId} isOwner={isOwner} />
      </div>

      {/* 2FA */}
      {isOwner && (
        <TwoFactorSettings businessId={businessId} enabled={twoFaEnabled} onToggle={setTwoFaEnabled} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-50 p-1 rounded-xl">
        {([
          ["members", "Członkowie"],
          ["audit", "Dziennik zmian"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card-modern p-5">
        {activeTab === "members" && (
          <MemberManager businessId={businessId} yourRole={yourRole} />
        )}
        {activeTab === "audit" && (
          <AuditLog businessId={businessId} />
        )}
      </div>

      {/* Role permissions info */}
      <div className="card-modern p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Uprawnienia ról</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left py-2 px-2 font-medium text-zinc-500">Akcja</th>
                <th className="text-center py-2 px-2 font-medium text-[#0d9488]">Właściciel</th>
                <th className="text-center py-2 px-2 font-medium text-blue-600">Admin</th>
                <th className="text-center py-2 px-2 font-medium text-zinc-500">Viewer</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {[
                ["Podgląd dashboardu", "✓", "✓", "✓"],
                ["Podgląd rozmów", "✓", "✓", "✓"],
                ["Podgląd leadów", "✓", "✓", "✓"],
                ["Edycja promptu AI", "✓", "✓", "✕"],
                ["Edycja ustawień", "✓", "✓", "✕"],
                ["Zmiana głosu", "✓", "✓", "✕"],
                ["Zarządzanie członkami", "✓", "✕", "✕"],
                ["Zmiana planu / płatności", "✓", "✕", "✕"],
                ["Weryfikacja firmy", "✓", "✕", "✕"],
                ["Eksport danych", "✓", "✕", "✕"],
              ].map(([action, owner, admin, viewer]) => (
                <tr key={action} className="border-b border-zinc-50 last:border-0">
                  <td className="py-2 px-2">{action}</td>
                  <td className="py-2 px-2 text-center">{owner}</td>
                  <td className="py-2 px-2 text-center">{admin}</td>
                  <td className="py-2 px-2 text-center">{viewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
