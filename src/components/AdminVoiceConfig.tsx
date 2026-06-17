"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { Business, Voice } from "@/types/database";

export default function AdminVoiceConfig() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    Promise.all([
      supabase.from("businesses").select("id, name, twilio_number, voice_id, current_plan").order("name"),
      supabase.from("voices").select("*").order("sort_order", { ascending: true }),
    ]).then(([bizRes, voiceRes]) => {
      setBusinesses((bizRes.data as Business[]) || []);
      setVoices((voiceRes.data as Voice[]) || []);
      setLoading(false);
    });
  }, []);

  async function setGlobalDefault(voiceId: string) {
    await fetch("/api/admin/voices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default", voiceId }),
    });
    const { data } = await supabase.from("voices").select("*").order("sort_order", { ascending: true });
    if (data) setVoices(data as Voice[]);
  }

  async function setBusinessVoice(businessId: string, voiceId: string | null) {
    await fetch("/api/admin/voices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_business_voice", businessId, voiceId }),
    });
    setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, voice_id: voiceId } : b));
  }

  async function previewVoice(voice: Voice) {
    if (playing === voice.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    try {
      const res = await fetch(`/api/elevenlabs/tts?voice_id=${voice.elevenlabs_voice_id}&text=Cze%C5%9B%C4%87%2C%20jestem%20${voice.display_name}%2C%20Twoj%C4%85%20automatyczn%C4%85%20recepcjonistk%C4%85%20WitaLine.`);
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(null); URL.revokeObjectURL(url); };
      setPlaying(voice.id);
      audio.play();
    } catch {
      setToast({ msg: "Nie udało się odtworzyć próbki", ok: false });
    }
  }

  async function syncToElevenLabs() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/voices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_elevenlabs" }),
      });
      if (res.ok) {
        setToast({ msg: "Synchronizacja z ElevenLabs zakończona", ok: true });
      } else {
        const err = await res.json();
        setToast({ msg: err.error || "Błąd synchronizacji", ok: false });
      }
    } catch {
      setToast({ msg: "Błąd synchronizacji", ok: false });
    }
    setSyncing(false);
  }

  const defaultVoice = voices.find(v => v.is_default);

  if (loading) return <div className="p-6 text-center text-zinc-400">Ładowanie...</div>;

  return (
    <div className="space-y-6">
      {toast && (
        <p className={`px-4 py-3 rounded-xl text-sm ${toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {toast.msg}
        </p>
      )}

      {/* Sync button */}
      <div className="flex justify-end">
        <button
          onClick={syncToElevenLabs}
          disabled={syncing}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-400 text-white hover:bg-brand-500 transition disabled:opacity-50"
        >
          {syncing ? "Synchronizacja..." : "🔄 Synchronizuj z ElevenLabs"}
        </button>
      </div>

      {/* All voices grid with preview */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Dostępne głosy</h3>
        <p className="text-xs text-zinc-400 mb-4">Kliknij play aby odsłuchać głos. Zaznacz domyślny dla nowych firm.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {voices.map(v => (
            <div
              key={v.id}
              className={`p-4 rounded-xl border-2 text-center transition relative ${
                v.is_default
                  ? "border-brand-400 bg-brand-50 ring-2 ring-brand-400/20"
                  : "border-zinc-200 hover:border-zinc-300"
              } ${!v.active ? "opacity-40" : ""}`}
            >
              <button
                onClick={() => previewVoice(v)}
                className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-2 transition ${
                  playing === v.id ? "bg-brand-400 text-white" : "bg-brand-50 text-zinc-600 hover:bg-brand-100"
                }`}
                title="Odtwórz próbkę"
              >
                {playing === v.id ? "⏹" : v.gender === "female" ? "👩" : "👨"}
              </button>
              <p className="text-sm font-semibold text-zinc-900">{v.display_name}</p>
              <p className="text-[10px] text-zinc-400">{v.gender === "female" ? "Kobieta" : "Mężczyzna"}</p>
              <p className="text-[9px] text-zinc-300 font-mono truncate">{v.elevenlabs_voice_id.slice(0, 16)}...</p>
              <div className="mt-2 flex justify-center gap-1">
                {!v.is_default ? (
                  <button onClick={() => setGlobalDefault(v.id)} className="text-[10px] px-2 py-0.5 rounded bg-brand-50 text-zinc-500 hover:bg-brand-100 hover:text-brand-600 transition">
                    Ustaw domyślny
                  </button>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-100 text-brand-600 font-semibold">DOMYŚLNY</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-business voice assignment */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Głosy dla firm</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white text-left">
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Firma</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Plan</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Głos</th>
                <th className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map(b => {
                const currentVoice = voices.find(v => v.id === b.voice_id);
                return (
                  <tr key={b.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50">
                    <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{b.name}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-600">{b.current_plan?.replace("_", " ")}</span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={b.voice_id || ""}
                        onChange={(e) => setBusinessVoice(b.id, e.target.value || null)}
                        className="w-full px-2 py-1 border border-zinc-200 rounded-lg text-sm"
                      >
                        <option value="">— Domyślny ({defaultVoice?.display_name || "Maja"}) —</option>
                        {voices.filter(v => v.active).filter(v => {
                          const planOrder = ["elastic_0", "start_100", "pro_249", "pro_500", "lux_599", "enterprise_2000"];
                          const bizIdx = planOrder.indexOf(b.current_plan as string);
                          const minIdx = planOrder.indexOf(v.min_plan as string);
                          return bizIdx >= minIdx;
                        }).map(v => (
                          <option key={v.id} value={v.id}>
                            {v.display_name} ({v.gender === "female" ? "👩" : "👨"}) — {v.min_plan.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {currentVoice ? (
                        <button
                          onClick={() => previewVoice(currentVoice)}
                          className="text-xs px-2 py-1 rounded bg-brand-50 text-zinc-600 hover:bg-brand-100 transition"
                        >
                          {playing === currentVoice.id ? "⏹" : "▶ Odtwórz"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">Domyślny</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
