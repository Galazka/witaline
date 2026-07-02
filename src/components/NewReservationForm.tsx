"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
  onCreated: () => void;
  prefillDate?: string;
  onClose?: () => void;
}

const inputClass =
  "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] placeholder:text-zinc-400 transition";

type ConflictInfo = {
  id: string;
  reserved_at: string;
  duration_minutes: number;
};

type SlotInfo = {
  date: string;
  time: string;
  label: string;
};

export default function NewReservationForm({ businessId, onCreated, prefillDate, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [reservedAt, setReservedAt] = useState(prefillDate || "");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<ConflictInfo[] | null>(null);
  const [nextSlots, setNextSlots] = useState<SlotInfo[]>([]);
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [showAvailable, setShowAvailable] = useState(false);

  useEffect(() => {
    if (prefillDate) {
      setReservedAt(prefillDate);
      setOpen(true);
    }
  }, [prefillDate]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!reservedAt || !open) return;
    const dateOnly = reservedAt.slice(0, 10);
    fetch(`/api/business/availability?business_id=${businessId}&date=${dateOnly}`)
      .then(r => r.json())
      .then(data => {
        if (data.slots) {
          setAvailableSlots(data.slots.map((s: { time: string; label: string }) => ({
            date: dateOnly,
            time: s.time,
            label: s.label,
          })));
        }
      })
      .catch(() => {});
  }, [reservedAt, open, businessId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceType || !reservedAt) return;

    // If we had a conflict and are forcing, send force=true
    // Otherwise, normal flow
    setSaving(true);
    setConflict(null);
    setNextSlots([]);

    const res = await fetch("/api/reservations", {
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
        force: conflict !== null,
      }),
    });

    const data = await res.json();

    setSaving(false);

    if (data.conflict || (!data.ok && data.nextSlots)) {
      setConflict(data.conflicts || []);
      setNextSlots(data.nextSlots || []);
      return;
    }

    if (!data.ok) {
      setConflict([{ id: "error", reserved_at: "", duration_minutes: 0 }]);
      return;
    }

    // Success
    resetForm();
    onCreated();
  }

  function resetForm() {
    setOpen(false);
    setCallerName("");
    setCallerPhone("");
    setServiceType("");
    setReservedAt(prefillDate || "");
    setDuration(30);
    setNotes("");
    setConflict(null);
    setNextSlots([]);
    setShowAvailable(false);
    onClose?.();
  }

  function fillSlot(slot: SlotInfo) {
    setReservedAt(`${slot.date}T${slot.time}`);
    setConflict(null);
    setNextSlots([]);
    setShowAvailable(false);
  }

  return (
    <div>
      <button
        onClick={() => { setOpen(!open); setConflict(null); setNextSlots([]); }}
        className="bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition"
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
            <div>
              <input type="datetime-local" value={reservedAt} onChange={(e) => { setReservedAt(e.target.value); setConflict(null); }} className={inputClass} required />
              {availableSlots.length > 0 && !conflict && (
                <button type="button" onClick={() => setShowAvailable(!showAvailable)} className="text-xs text-[#0d9488] mt-1 hover:underline">
                  {showAvailable ? "Ukryj" : `Pokaż wolne terminy (${availableSlots.length})`}
                </button>
              )}
              {showAvailable && availableSlots.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {availableSlots.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => fillSlot(s)}
                      className="block w-full text-left text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>

          {/* Conflict warning */}
          {conflict && conflict.length > 0 && conflict[0].id !== "error" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm font-medium">Konflikt terminów</span>
              </div>
              <p className="text-sm text-amber-700">
                Ten termin koliduje z {conflict.length} istniejącą rezerwacją:
              </p>
              <ul className="text-xs text-amber-600 space-y-1">
                {conflict.map((c) => (
                  <li key={c.id}>• {new Date(c.reserved_at).toLocaleString("pl-PL")} ({c.duration_minutes} min)</li>
                ))}
              </ul>

              {/* Next available slots */}
              {nextSlots.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-2">Dostępne terminy:</p>
                  <div className="flex flex-wrap gap-2">
                    {nextSlots.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => fillSlot(s)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {saving ? "..." : "Mimo to zapisz"}
                </button>
                <button
                  type="button"
                  onClick={() => { setConflict(null); setNextSlots([]); }}
                  className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition"
                >
                  Edytuj termin
                </button>
              </div>
            </div>
          )}

          {conflict && conflict.length === 1 && conflict[0].id === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">Nie udało się zapisać rezerwacji. Spróbuj ponownie.</p>
            </div>
          )}

          {!conflict && (
            <>
              <textarea
                placeholder="Notatki (opcjonalnie)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0d9488] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
                >
                  {saving ? "Sprawdzanie..." : "Zapisz rezerwację"}
                </button>
                {onClose && (
                  <button type="button" onClick={resetForm} className="text-sm text-zinc-400 hover:text-zinc-600 px-3">
                    Anuluj
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
