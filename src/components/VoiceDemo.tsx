"use client";

import { useState, useCallback } from "react";

const DEMO_SCRIPT = "Dzień dobry! Dziękujemy za zainteresowanie WitaLine. Jestem asystentem AI, który odbiera telefony za Ciebie. Przyjmuję zamówienia, umawiam wizyty i odpowiadam na pytania. Działam 24 godziny na dobę, 7 dni w tygodniu. Chcesz dowiedzieć się więcej? Wejdź na naszą stronę i rozpocznij bezpłatny okres testowy. Do usłyszenia!";

function hasPolishVoice(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => v.lang.startsWith("pl"));
}

export default function VoiceDemo({ className = "" }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = useCallback(() => {
    setError(null);
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    if (!window.speechSynthesis) {
      setError("Twoja przeglądarka nie obsługuje syntezy mowy.");
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const hasPolish = voices.some(v => v.lang.startsWith("pl"));
    if (!hasPolish) {
      setError("Głos polski niedostępny — demo zostanie odegrane po angielsku.");
    }
    const utterance = new SpeechSynthesisUtterance(DEMO_SCRIPT);
    utterance.lang = "pl-PL";
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    const plVoice = voices.find(v => v.lang.startsWith("pl"));
    if (plVoice) utterance.voice = plVoice;
    utterance.onend = () => { setPlaying(false); setError(null); };
    utterance.onerror = (e) => { setPlaying(false); setError("Błąd odtwarzania: " + e.error); };
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }, [playing]);

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <button
        onClick={handlePlay}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-brand-400 hover:bg-brand-500 transition"
      >
        {playing ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      <p className="text-sm text-zinc-600">{playing ? "Odtwarzam..." : "Posłuchaj demo"}</p>
      {error && <p className="text-xs text-red-500 text-center max-w-xs">{error}</p>}
    </div>
  );
}
