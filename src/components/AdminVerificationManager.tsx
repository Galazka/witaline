"use client";

import { useState, useEffect } from "react";

interface VerificationLog {
  id: string;
  old_status: string;
  new_status: string;
  note: string | null;
  created_at: string;
  admin_email?: { email: string } | string;
}

interface BusinessVerification {
  id: string;
  name: string;
  nip: string | null;
  krs: string | null;
  verification_status: string;
  verification_doc_url: string | null;
  verification_notes: string | null;
  verified_at: string | null;
  owner_email?: { email: string } | string;
  logs: VerificationLog[];
}

export default function AdminVerificationManager() {
  const [businesses, setBusinesses] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
      body: JSON.stringify({ businessId, status, note: notes[businessId] || null }),
    });
    if (res.ok) {
      await fetchVerifications();
      setNotes(prev => ({ ...prev, [businessId]: "" }));
    }
    setUpdating(null);
  };

  function getEmail(email: string | { email: string } | undefined): string {
    if (!email) return "";
    if (typeof email === "string") return email;
    return email.email;
  }

  if (loading) return <div className="p-6 text-sm text-zinc-500">Ładowanie...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-lg font-semibold text-zinc-800 mb-4">Weryfikacja firm</h2>
      <div className="space-y-4">
        {businesses.length === 0 ? (
          <p className="text-sm text-zinc-400">Brak wniosków</p>
        ) : (
          businesses.map((biz) => (
            <div key={biz.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-800">{biz.name}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
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
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{getEmail(biz.owner_email) || biz.id}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {biz.verification_status === "pending" && updating !== biz.id && (
                    <>
                      <button onClick={() => handleUpdate(biz.id, "verified")} className="px-3 py-1.5 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200 font-medium">
                        ✓ Zatwierdź
                      </button>
                      <button onClick={() => handleUpdate(biz.id, "rejected")} className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium">
                        ✕ Odrzuć
                      </button>
                    </>
                  )}
                  {updating === biz.id && <span className="text-xs text-zinc-400">Zapisywanie...</span>}
                </div>
              </div>

              {/* Details */}
              <div className="px-4 pb-2 space-y-1">
                {biz.nip && <p className="text-xs text-zinc-500">NIP: <span className="font-mono text-zinc-700">{biz.nip}</span></p>}
                {biz.krs && <p className="text-xs text-zinc-500">KRS: <span className="font-mono text-zinc-700">{biz.krs}</span></p>}
                {biz.verification_doc_url && (
                  <p className="text-xs">
                    <a href={biz.verification_doc_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      📎 Dokument rejestrowy
                    </a>
                  </p>
                )}
              </div>

              {/* Admin note input */}
              <div className="px-4 pb-3">
                <textarea
                  placeholder="Notatka administratora (opcjonalnie)..."
                  value={notes[biz.id] || ""}
                  onChange={e => setNotes(prev => ({ ...prev, [biz.id]: e.target.value }))}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0d9488] resize-none"
                  rows={2}
                />
              </div>

              {/* History toggle */}
              {biz.logs && biz.logs.length > 0 && (
                <div className="border-t border-zinc-100">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [biz.id]: !prev[biz.id] }))}
                    className="w-full px-4 py-2 text-xs text-zinc-500 hover:text-zinc-700 text-left flex items-center gap-1"
                  >
                    <span className="transition-transform" style={{ transform: expanded[biz.id] ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    Historia ({biz.logs.length})
                  </button>
                  {expanded[biz.id] && (
                    <div className="px-4 pb-3 space-y-2">
                      {biz.logs.map((log) => (
                        <div key={log.id} className="text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.old_status} → {log.new_status}</span>
                            <span>{new Date(log.created_at).toLocaleString("pl-PL")}</span>
                          </div>
                          {getEmail(log.admin_email as any) && <p className="text-zinc-400">przez: {getEmail(log.admin_email as any)}</p>}
                          {log.note && <p className="text-zinc-600 mt-0.5 italic">"{log.note}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
