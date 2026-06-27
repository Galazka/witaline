"use client";

import { useState, useEffect } from "react";

interface BusinessVerification {
  id: string;
  name: string;
  nip: string | null;
  krs: string | null;
  verification_status: string;
  verified_at: string | null;
  owner_email?: string;
}

export default function AdminVerificationManager() {
  const [businesses, setBusinesses] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchVerifications = async () => {
    try {
      const res = await fetch("/api/admin/verifications");
      if (res.ok) setBusinesses(await res.json());
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchVerifications(); }, []);

  const handleUpdate = async (businessId: string, status: string) => {
    setUpdating(businessId);
    const res = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, status }),
    });
    if (res.ok) {
      await fetchVerifications();
    }
    setUpdating(null);
  };

  if (loading) return <div className="p-6 text-sm text-zinc-500">Ładowanie...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">Weryfikacja firm</h2>
      <div className="space-y-2">
        {businesses.length === 0 ? (
          <p className="text-sm text-zinc-400">Brak wniosków</p>
        ) : (
          businesses.map((biz) => (
            <div key={biz.id} className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">{biz.name}</p>
                <p className="text-xs text-zinc-500">{biz.owner_email || biz.id}</p>
                {biz.nip && <p className="text-xs text-zinc-400">NIP: {biz.nip}</p>}
                {biz.krs && <p className="text-xs text-zinc-400">KRS: {biz.krs}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  biz.verification_status === "verified" ? "bg-green-100 text-green-700"
                  : biz.verification_status === "pending" ? "bg-amber-100 text-amber-700"
                  : biz.verification_status === "rejected" ? "bg-red-100 text-red-600"
                  : "bg-zinc-100 text-zinc-500"
                }`}>
                  {biz.verification_status === "verified" ? "Zweryfikowano"
                    : biz.verification_status === "pending" ? "Oczekuje"
                    : biz.verification_status === "rejected" ? "Odrzucono"
                    : "Niezweryfikowano"}
                </span>
                {biz.verification_status === "pending" && updating !== biz.id && (
                  <>
                    <button
                      onClick={() => handleUpdate(biz.id, "verified")}
                      className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                    >
                      ✓ Zatwierdź
                    </button>
                    <button
                      onClick={() => handleUpdate(biz.id, "rejected")}
                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      ✕ Odrzuć
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}