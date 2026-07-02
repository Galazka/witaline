"use client";

import { useState, useEffect } from "react";

export default function MajaPromptEditor() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    fetchPrompt();
  }, []);

  async function fetchPrompt() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/elevenlabs/agent");
      const data = await res.json();
      if (data.ok) {
        setPrompt(data.prompt);
        setCharCount(data.prompt.length);
      } else {
        setError(data.error || "Nie udało się pobrać promptu");
      }
    } catch (e) {
      setError("Błąd połączenia z ElevenLabs API");
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/elevenlabs/agent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Prompt Mai zaktualizowany");
      } else {
        setMessage("❌ " + (data.error || "Błąd zapisu"));
      }
    } catch (e) {
      setMessage("❌ Błąd sieci");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="bg-white/55 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <p className="text-sm text-zinc-400">Ładowanie promptu Mai...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">🧠 Prompt Mai (główny agent WitaLine)</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ten prompt jest używany przez głównego asystenta WitaLine. Zmiany dotyczą wszystkich rozmów.
          </p>
        </div>
        <span className="text-xs text-zinc-400 font-mono">{charCount} znaków</span>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setCharCount(e.target.value.length); }}
          rows={24}
          className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-mono leading-relaxed resize-y"
          placeholder="System prompt dla agenta ElevenLabs..."
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {charCount > 3000 ? (
              <span className="text-amber-600 font-medium">⚠️ Powyżej 3000 znaków — agent może działać wolniej</span>
            ) : (
              "Rekomendowane: do 3000 znaków"
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={fetchPrompt}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
            >
              Przywróć
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "💾 Zapisz prompt"}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
