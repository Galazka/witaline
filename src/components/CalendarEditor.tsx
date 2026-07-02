"use client";

import { useState, useEffect } from "react";
import type { CalendarSettings, CalendarDay } from "@/types/database";

const DAYS = [
  { key: "monday", label: "Poniedziałek" },
  { key: "tuesday", label: "Wtorek" },
  { key: "wednesday", label: "Środa" },
  { key: "thursday", label: "Czwartek" },
  { key: "friday", label: "Piątek" },
  { key: "saturday", label: "Sobota" },
  { key: "sunday", label: "Niedziela" },
];

const defaultDay: CalendarDay = { enabled: false, start: "09:00", end: "17:00" };

interface Props {
  businessId: string;
  initial: CalendarSettings;
  onUpdate: () => void;
}

export default function CalendarEditor({ businessId, initial, onUpdate }: Props) {
  const [settings, setSettings] = useState<CalendarSettings>(initial);
  const [saving, setSaving] = useState(false);

  function toggleDay(key: string) {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...(prev[key as keyof CalendarSettings] as CalendarDay || defaultDay), enabled: !((prev[key as keyof CalendarSettings] as CalendarDay)?.enabled ?? false) },
    }));
  }

  function setDayTime(key: string, field: "start" | "end", value: string) {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...(prev[key as keyof CalendarSettings] as CalendarDay || defaultDay), [field]: value },
    }));
  }

  function setBuffer(val: number) {
    setSettings((prev) => ({ ...prev, buffer_minutes: val }));
  }

  function setInterval(val: number) {
    setSettings((prev) => ({ ...prev, slot_interval: val }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/business/calendar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, business_id: businessId }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          Grafik przyjęć
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Ustaw w jakich godzinach asystent AI może umawiać rezerwacje.
        </p>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = settings[key as keyof CalendarSettings] as CalendarDay | undefined;
          const enabled = day?.enabled ?? false;
          return (
            <div
              key={key}
              className={`flex items-center gap-4 p-3 rounded-xl border transition ${
                enabled ? "bg-brand-50 border-[#0d9488]/20" : "bg-white border-zinc-200"
              }`}
            >
              <button
                onClick={() => toggleDay(key)}
                className={`w-10 h-6 rounded-full transition relative shrink-0 ${
                  enabled ? "bg-[#0d9488]" : "bg-brand-200"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
                    enabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium w-28 ${
                  enabled ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
              {enabled && (
                <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day?.start || "09:00"}
                      onChange={(e) => setDayTime(key, "start", e.target.value)}
                      className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition"
                    />
                    <span className="text-zinc-400 text-sm">—</span>
                    <input
                      type="time"
                      value={day?.end || "17:00"}
                      onChange={(e) => setDayTime(key, "end", e.target.value)}
                      className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition"
                    />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 block">
            Przerwa między wizytami
          </label>
          <select
            value={settings.buffer_minutes}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition"
          >
            <option value={0}>Brak</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 block">
            Interwał slotów
          </label>
          <select
            value={settings.slot_interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
      >
        {saving ? "Zapisywanie..." : "Zapisz grafik"}
      </button>
    </div>
  );
}




