"use client";

import { useState } from "react";
import type { Service } from "@/types/database";

interface Props {
  businessId: string;
  services: Service[];
  onUpdate: () => void;
}

const inputClass =
  "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500 placeholder:text-zinc-400 transition";

const labelClass = "text-xs font-medium text-zinc-500 block mb-1";

export default function ServicesEditor({ businessId, services, onUpdate }: Props) {
  const [items, setItems] = useState<Service[]>(services.length > 0 ? services : []);
  const [saving, setSaving] = useState(false);

  function addService() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", duration_minutes: 30, price: undefined, description: "" },
    ]);
  }

  function removeService(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  function updateService(id: string, field: keyof Service, value: string | number) {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/business/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, services: items.filter((s) => s.name.trim()) }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Usługi</h3>
          <p className="text-sm text-zinc-500">Zdefiniuj usługi, które asystent AI będzie oferować przez telefon.</p>
        </div>
        <button onClick={addService} className="bg-brand-50 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-100 transition">
          + Dodaj usługę
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-200 rounded-xl">Brak usług. Dodaj pierwszą usługę.</p>
      )}

      <div className="space-y-3">
        {items.map((svc) => (
          <div key={svc.id} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <input placeholder="Nazwa usługi (np. Strzyżenie męskie)" value={svc.name} onChange={(e) => updateService(svc.id, "name", e.target.value)} className={inputClass} />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={labelClass}>Czas trwania (min)</label>
                    <select value={svc.duration_minutes} onChange={(e) => updateService(svc.id, "duration_minutes", Number(e.target.value))} className={inputClass}>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Cena (opcjonalnie)</label>
                    <input type="number" placeholder="0.00" value={svc.price ?? ""}
                      onChange={(e) => updateService(svc.id, "price", e.target.value ? Number(e.target.value) : undefined as unknown as number)}
                      className={inputClass} />
                  </div>
                </div>
                <input placeholder="Opis (opcjonalnie)" value={svc.description || ""} onChange={(e) => updateService(svc.id, "description", e.target.value)} className={inputClass} />
              </div>
              <button onClick={() => removeService(svc.id)} className="text-red-400 hover:text-red-600 transition text-xs font-medium mt-2 shrink-0">
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.filter((s) => s.name.trim()).length > 0 && (
        <button onClick={handleSave} disabled={saving}
          className="bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50">
          {saving ? "Zapisywanie..." : "Zapisz usługi"}
        </button>
      )}
    </div>
  );
}




