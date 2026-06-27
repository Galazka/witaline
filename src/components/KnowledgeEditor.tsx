"use client";

import { useState } from "react";

interface Props {
  businessId: string;
  systemPrompt: string;
  menuCatalog: Record<string, unknown>;
  onUpdate: () => void;
}

export default function KnowledgeEditor({
  businessId,
  systemPrompt,
  menuCatalog,
  onUpdate,
}: Props) {
  const [prompt, setPrompt] = useState(systemPrompt || "");
  const [hours, setHours] = useState(
    JSON.stringify(menuCatalog, null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        systemPrompt: prompt,
        menuCatalog: (() => {
          try {
            return JSON.parse(hours);
          } catch {
            return {};
          }
        })(),
      }),
    });
    if (res.ok) {
      setMessage("Zapisano");
      onUpdate();
    } else {
      setMessage("Błąd zapisu");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          System Prompt (instrukcja dla bota)
        </h3>
        <p className="text-sm text-zinc-500 mb-3">
          To jest instrukcja, którą bot głosowy otrzymuje na starcie każdej
          rozmowy. Określa jak bot się zachowuje, co mówi i jak przyjmuje
          zamówienia.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] h-48 resize-none"
          placeholder="Jesteś recepcjonistą AI..."
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          Baza wiedzy (JSON)
        </h3>
        <p className="text-sm text-zinc-500 mb-3">
          Cennik, menu, godziny otwarcia, adres — wszystko co bot musi wiedzieć
          o firmie. Format JSON.
        </p>
        <textarea
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] h-48 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#0d9488] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
      >
        {saving ? "Zapisywanie..." : "Zapisz zmiany"}
      </button>

      {message && (
        <p className="text-sm text-[#0d9488] bg-brand-50 border border-[#0d9488]/20 rounded-lg px-4 py-3">
          {message}
        </p>
      )}
    </div>
  );
}




