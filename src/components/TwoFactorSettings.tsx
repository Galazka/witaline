"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function TwoFactorSettings({ businessId, enabled, onToggle }: Props) {
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "disable">("idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSetup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      setQrUrl(data.qrUrl);
      setSecret(data.secret);
      setStep("setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nieprawidłowy kod");
      setSuccess("2FA zostało włączone!");
      setStep("idle");
      setToken("");
      onToggle(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nieprawidłowy kod");
      setSuccess("2FA zostało wyłączone!");
      setStep("idle");
      setToken("");
      onToggle(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">Dwuskładnikowa weryfikacja (2FA)</h4>
          <p className="text-xs text-zinc-400 mt-0.5">Dodaj dodatkową warstwę bezpieczeństwa do logowania</p>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${enabled ? "bg-[#0d9488]" : "bg-brand-100"}`}
          onClick={() => {
            if (enabled) { setStep("disable"); setToken(""); setError(""); }
            else { handleSetup(); }
          }}>
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
        </div>
      </div>

      {enabled && step !== "disable" && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          2FA aktywne — logowanie wymaga kodu z aplikacji
        </div>
      )}

      {/* Setup flow */}
      {step === "setup" && qrUrl && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-3">Zeskanuj kod QR w aplikacji Google Authenticator, Authy lub innej:</p>
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl border border-zinc-200" />
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Klucz ręczny (jeśli nie możesz zeskanować):</p>
            <p className="text-xs font-mono text-zinc-700 break-all">{secret}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Wpisz kod z aplikacji</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
              onKeyDown={e => { if (e.key === "Enter") handleVerify(); }}
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStep("idle"); setToken(""); setError(""); }} className="flex-1 py-2.5 bg-brand-50 text-zinc-600 rounded-xl text-sm font-medium hover:bg-[#ccfbf1] transition">Anuluj</button>
            <button onClick={handleVerify} disabled={loading || token.length !== 6} className="flex-1 py-2.5 bg-[#0d9488] text-white rounded-xl text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50">
              {loading ? "Sprawdzanie..." : "Włącz 2FA"}
            </button>
          </div>
        </div>
      )}

      {/* Disable flow */}
      {step === "disable" && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-zinc-500">Aby wyłączyć 2FA, wpisz kod z aplikacji:</p>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
            onKeyDown={e => { if (e.key === "Enter") handleDisable(); }}
          />
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStep("idle"); setToken(""); setError(""); }} className="flex-1 py-2.5 bg-brand-50 text-zinc-600 rounded-xl text-sm font-medium hover:bg-[#ccfbf1] transition">Anuluj</button>
            <button onClick={handleDisable} disabled={loading || token.length !== 6} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
              {loading ? "Sprawdzanie..." : "Wyłącz 2FA"}
            </button>
          </div>
        </div>
      )}

      {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
    </div>
  );
}
