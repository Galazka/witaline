"use client";

import { useState, useEffect } from "react";

interface Voice {
  id: string;
  display_name: string;
  gender: "male" | "female";
  elevenlabs_voice_id: string;
  is_default: boolean;
  min_plan: string;
}

interface Props {
  businessId: string;
  balance: number;
}

export default function AccountSettings({ businessId, balance }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentVoiceId, setCurrentVoiceId] = useState<string | null>(null);
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");

  useEffect(() => {
    fetch("/api/business/voice").then(r => r.ok && r.json()).then(d => {
      if (d) { setVoices(d.available || []); setCurrentVoiceId(d.voiceId || null); }
    }).catch(() => {});
  }, []);

  async function handleVoiceChange(newVoiceId: string) {
    setSavingVoice(true);
    setVoiceMsg("");
    const res = await fetch("/api/business/voice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId: newVoiceId || null }),
    });
    if (res.ok) {
      setCurrentVoiceId(newVoiceId || null);
      setVoiceMsg("✅ Głos został zmieniony");
    } else {
      const d = await res.json();
      setVoiceMsg("❌ " + (d.error || "Błąd"));
    }
    setSavingVoice(false);
  }

  async function handleDelete() {
    if (confirmText !== "USUŃ KONTO") return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/business/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, confirmText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd usuwania konta");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć konta");
    }
    setDeleting(false);
  }

  const femaleVoices = voices.filter(v => v.gender === "female");
  const maleVoices = voices.filter(v => v.gender === "male");

  if (done) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-1">Konto zostało usunięte</h3>
        <p className="text-sm text-zinc-500">Wszystkie dane zostały trwale usunięte. Za chwilę nastąpi przekierowanie.</p>
        <button onClick={() => window.location.href = "/"} className="mt-4 text-sm text-brand-400 hover:underline">Wróć do strony głównej</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Ustawienia konta</h3>
        <p className="text-sm text-zinc-500">Zarządzaj swoim kontem, saldem, głosem i danymi osobowymi.</p>
      </div>

      {/* Balance */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Saldo prepaid</p>
        <p className="text-2xl font-bold text-brand-400">{(balance || 0).toFixed(2)} PLN</p>
        <p className="text-xs text-zinc-400 mt-1">Koszt numeru: 30 PLN | Minuty: wg planu</p>
      </div>

      {/* Voice selection */}
      {voices.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Głos asystenta</p>
          <p className="text-xs text-zinc-500 mb-4">Wybierz głos, którym będzie mówił Twój asystent na stronie i przez telefon.</p>

          {femaleVoices.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-zinc-700 mb-2">👩 Głosy żeńskie — przedstawia się jako Maja</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {femaleVoices.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    disabled={savingVoice}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      currentVoiceId === v.id ? "border-brand-400 bg-brand-50 ring-2 ring-brand-400/20" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-900">{v.display_name}</p>
                    <p className="text-[10px] text-zinc-400">{v.min_plan === "start_100" ? "START" : v.min_plan === "pro_500" ? "GROWTH" : v.min_plan === "pro_249" ? "PRO" : v.min_plan === "lux_599" ? "LUX" : v.min_plan === "elastic_0" ? "ELASTIC" : "ENTERPRISE"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {maleVoices.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-700 mb-2">👨 Głosy męskie — przedstawia się jako Tomasz</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {maleVoices.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    disabled={savingVoice}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      currentVoiceId === v.id ? "border-brand-400 bg-brand-50 ring-2 ring-brand-400/20" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-900">{v.display_name}</p>
                    <p className="text-[10px] text-zinc-400">{v.min_plan === "start_100" ? "START" : v.min_plan === "pro_500" ? "GROWTH" : v.min_plan === "pro_249" ? "PRO" : v.min_plan === "lux_599" ? "LUX" : v.min_plan === "elastic_0" ? "ELASTIC" : "ENTERPRISE"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {voiceMsg && <p className="text-xs mt-2">{voiceMsg}</p>}
        </div>
      )}

      {/* Account info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Informacje o koncie</p>
        <p className="text-xs text-zinc-500">
          Twoje dane są przechowywane zgodnie z <a href="/polityka-prywatnosci" className="text-brand-400 hover:underline">Polityką prywatności</a>.
          Nagrania i transkrypcje są automatycznie usuwane po 30 dniach.
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Masz prawo do bycia zapomnianym — administrator może usunąć wszystkie dane powiązane z numerem telefonu.
          Skontaktuj się z <a href="mailto:rodo@witaline.pl" className="text-brand-400 hover:underline">rodo@witaline.pl</a>.
        </p>
      </div>

      {/* Delete account */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h4 className="text-sm font-bold text-red-700 mb-2">Strefa niebezpieczna — usunięcie konta</h4>
        <p className="text-xs text-red-600 mb-4">
          Usunięcie konta jest nieodwracalne. Spowoduje trwałe usunięcie wszystkich danych:
          numeru telefonu, nagrań, transkrypcji, ustawień i statystyk.
          Subskrypcja Stripe zostanie anulowana.
        </p>
        <p className="text-xs text-red-600 mb-3">
          Niewykorzystane środki z salda prepaid podlegają zwrotowi na wniosek.
        </p>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Wpisz USUŃ KONTO aby potwierdzić"
            className="flex-1 border border-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
          />
          <button
            onClick={handleDelete}
            disabled={confirmText !== "USUŃ KONTO" || deleting}
            className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 whitespace-nowrap"
          >
            {deleting ? "Usuwanie..." : "Usuń konto"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
