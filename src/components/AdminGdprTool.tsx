"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Props {
  supabase: SupabaseClient;
}

export default function AdminGdprTool({ supabase }: Props) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState("");

  async function handleGdprDelete() {
    if (!phone.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/gdpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      setResult(data.message + "\n\nSzczegóły:\n" + JSON.stringify(data.details, null, 2));
      setStatus("done");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Nie udało się usunąć danych");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-lg">
      <h3 className="text-lg font-bold text-zinc-900 mb-2">Prawo do bycia zapomnianym</h3>
      <p className="text-sm text-zinc-500 mb-4">
        Trwale usuń wszystkie dane powiązane z podanym numerem telefonu: nagrania, transkrypcje, historię rozmów, opinie.
        Tej operacji nie można cofnąć.
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+48 123 456 789"
          className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
        />
        <button
          onClick={handleGdprDelete}
          disabled={status === "loading" || !phone.trim()}
          className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "Usuwanie..." : "Usuń dane"}
        </button>
      </div>
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-wrap ${status === "done" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {result}
        </div>
      )}
    </div>
  );
}
