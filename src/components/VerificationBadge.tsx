"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
  isOwner: boolean;
}

export default function VerificationBadge({ businessId, isOwner }: Props) {
  const [status, setStatus] = useState<string>("unverified");
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [nip, setNip] = useState("");
  const [krs, setKrs] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/business/verification?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setVerifiedAt(data.verifiedAt);
        setNip(data.nip || "");
        setKrs(data.krs || "");
      }
    } catch {}
    setLoading(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/business/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, nip: nip || undefined, krs: krs || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("pending");
        setMessage("Wniosek wysłany do weryfikacji!");
      } else {
        setMessage(data.error || "Błąd");
      }
    } catch {
      setMessage("Błąd połączenia");
    }
    setSubmitting(false);
  }

  if (loading) return null;

  const statusConfig = {
    unverified: { label: "Niezwer.", color: "bg-brand-50 text-zinc-500", icon: "?" },
    pending: { label: "Weryfikacja...", color: "bg-amber-100 text-amber-600", icon: "⏳" },
    verified: { label: "Zweryfikowano", color: "bg-green-100 text-green-700", icon: "✓" },
    rejected: { label: "Odrzucono", color: "bg-red-100 text-red-600", icon: "✕" },
  };

  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.unverified;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">Weryfikacja firmy</h3>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {status === "verified" && verifiedAt && (
        <p className="text-xs text-green-600">
          Zweryfikowano dnia {new Date(verifiedAt).toLocaleDateString("pl-PL")}
        </p>
      )}

      {status === "unverified" && isOwner && (
        <div className="bg-white rounded-xl p-4 space-y-3">
          <p className="text-xs text-zinc-500">
            Zweryfikuj firmę, aby otrzymać odznakę "Zweryfikowano" i móc edytować dane. Wymagany NIP lub KRS.
          </p>
          <div className="space-y-2">
            <input
              value={nip}
              onChange={e => setNip(e.target.value)}
              placeholder="NIP (10 cyfr)"
              maxLength={10}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
            />
            <input
              value={krs}
              onChange={e => setKrs(e.target.value)}
              placeholder="KRS (opcjonalnie)"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || (!nip && !krs)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0d9488] rounded-xl hover:bg-[#0f766e] transition disabled:opacity-50"
            >
              {submitting ? "Wysyłanie..." : "Złóż wniosek weryfikacyjny"}
            </button>
          </div>
          {message && <p className="text-xs text-zinc-500">{message}</p>}
        </div>
      )}

      {status === "pending" && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
          Wniosek weryfikacyjny jest rozpatrywany. Otrzymasz powiadomienie e-mail po decyzji.
        </p>
      )}

      {status === "rejected" && isOwner && (
        <div className="bg-red-50 rounded-xl p-4 space-y-2">
          <p className="text-xs text-red-600">Weryfikacja została odrzucona. Skontaktuj się z supportem.</p>
          <button onClick={handleSubmit} className="text-xs text-red-600 underline">
            Złóż ponownie
          </button>
        </div>
      )}
    </div>
  );
}
