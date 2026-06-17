"use client";

import { useState } from "react";

interface Props {
  businessId: string;
  onCreated: () => void;
}

const inputClass =
  "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500 placeholder:text-zinc-400 transition";

export default function NewReservationForm({ businessId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [reservedAt, setReservedAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceType || !reservedAt) return;
    setSaving(true);
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: businessId,
        caller_name: callerName,
        caller_phone: callerPhone,
        service_type: serviceType,
        reserved_at: new Date(reservedAt).toISOString(),
        duration_minutes: duration,
        notes,
      }),
    });
    setSaving(false);
    setOpen(false);
    setCallerName("");
    setCallerPhone("");
    setServiceType("");
    setReservedAt("");
    setDuration(30);
    setNotes("");
    onCreated();
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-500 transition"
      >
        + Nowa rezerwacja
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white rounded-xl border border-zinc-200 p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Imię i nazwisko" value={callerName} onChange={(e) => setCallerName(e.target.value)} className={inputClass} />
            <input placeholder="Telefon" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} className={inputClass} />
          </div>
          <input
            placeholder="Usługa (np. Obiad na wynos, Stół na 19:00)"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className={inputClass}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input type="datetime-local" value={reservedAt} onChange={(e) => setReservedAt(e.target.value)} className={inputClass} required />
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>
          <textarea
            placeholder="Notatki (opcjonalnie)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
            rows={2}
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
          >
            {saving ? "Zapisywanie..." : "Zapisz rezerwację"}
          </button>
        </form>
      )}
    </div>
  );
}




