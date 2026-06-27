"use client";

import { useState, useRef } from "react";

interface VoiceCloneManagerProps {
  businessId: string;
  currentPlan: string;
  currentVoiceId?: string;
  currentVoiceName?: string;
}

export default function VoiceCloneManager({ businessId, currentPlan, currentVoiceId, currentVoiceName }: VoiceCloneManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [cloning, setCloning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; voice_id?: string; display_name?: string; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (currentPlan !== "enterprise_2000" && currentPlan !== "enterprise" && !currentPlan?.startsWith("elastic")) {
    return (
      <div className="bg-white rounded-xl p-6 text-center space-y-3">
        <span className="text-4xl block">🎤</span>
        <h3 className="text-lg font-semibold text-zinc-900">Klonowanie głosu</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Klonowanie głosu dostępne jako dodatek przy zakupie pakietu minut lub w pakiecie Enterprise.
        </p>
        <button
          onClick={() => window.location.href = "/dashboard?tab=upgrade"}
          className="inline-block bg-[#0d9488] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
        >
          Kup dodatek lub zmień plan
        </button>
      </div>
    );
  }

  async function handleClone() {
    if (!cloneName.trim() || files.length < 1) return;
    setCloning(true);
    setResult(null);

    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("name", cloneName.trim());
    for (const file of files) {
      formData.append("sample_files", file);
    }

    try {
      const fileUrls: string[] = [];
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        fileUrls.push(dataUrl);
      }

      const res = await fetch("/api/elevenlabs/clone-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          name: cloneName.trim(),
          sample_urls: fileUrls,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setCloning(false);
    }
  }

  function handleTest() {
    if (!result?.voice_id) return;
    window.open(`https://elevenlabs.io/voice-lab?voice_id=${result.voice_id}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Klonowanie głosu</h3>
        <p className="text-sm text-zinc-500">Dostosuj głos swojego asystenta — klonuj swój własny głos lub dowolny inny.</p>
      </div>

      {currentVoiceId && (
        <div className="bg-brand-50 rounded-xl p-4 space-y-1">
          <p className="text-xs text-[#0d9488] font-medium">Aktualny głos</p>
          <p className="text-sm text-zinc-900 font-medium">{currentVoiceName || "Głos niestandardowy"}</p>
          <p className="text-xs text-zinc-400 font-mono">{currentVoiceId}</p>
        </div>
      )}

      {!showForm && !cloning && !result && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0d9488] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
        >
          Sklonuj mój głos
        </button>
      )}

      {showForm && !cloning && !result && (
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nazwa klonu</label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="np. Mój głos - wersja 1"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-1">Nagrania głosu</p>
            <p className="text-xs text-zinc-400 mb-3">Wyślij 3-5 nagrań swojego głosu (każde 10-30 sekund). Im więcej różnorodnych nagrań, tym lepszy efekt.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-[#0d9488] hover:file:bg-brand-100"
            />
            {files.length > 0 && (
              <p className="text-xs text-zinc-500 mt-2">Wybrano {files.length} plików</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClone}
              disabled={!cloneName.trim() || files.length < 1}
              className="bg-[#0d9488] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Rozpocznij klonowanie
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 transition"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {cloning && (
        <div className="bg-white rounded-xl p-8 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-zinc-700">Tworzenie klonu głosu...</p>
          <p className="text-xs text-zinc-400">To może potrwać kilka minut. Nie zamykaj tej strony.</p>
        </div>
      )}

      {result && !cloning && (
        <div className={`rounded-xl p-6 space-y-3 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
          {result.success ? (
            <>
              <p className="text-green-700 font-medium text-base">Klon głosu gotowy!</p>
              <p className="text-sm text-zinc-700">Nazwa: <strong>{result.display_name}</strong></p>
              {result.voice_id && <p className="text-xs text-zinc-400 font-mono">ID: {result.voice_id}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={handleTest} className="bg-[#0d9488] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition">
                  Testuj
                </button>
                <button onClick={() => { setShowForm(false); setResult(null); setFiles([]); setCloneName(""); }} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition">
                  Zamknij
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-red-700 font-medium">Klonowanie nie powiodło się</p>
              <p className="text-sm text-zinc-600">{result.error || "Spróbuj ponownie później."}</p>
              <button onClick={() => { setResult(null); setShowForm(true); }} className="text-sm text-[#0d9488] hover:text-[#0f766e] transition font-medium">
                Spróbuj ponownie
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
