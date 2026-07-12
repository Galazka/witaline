"use client";

import { useState, useCallback } from "react";
import type { Service } from "@/types/database";

interface Props {
  businessId: string;
  businessName: string;
  services: Service[];
}

type Step = 1 | 2 | 3 | 4 | 5 | "done" | "error";

export default function PublicBookingWidget({ businessId, businessName, services }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [slots, setSlots] = useState<{ time: string; label: string }[]>([]);
  const [noSlots, setNoSlots] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  const steps = [1, 2, 3, 4, 5];

  const handleBack = useCallback(() => {
    setErrorMessage("");
    if (typeof step === "number" && step > 1) setStep((step - 1) as Step);
  }, [step]);

  const handleServiceSelect = useCallback((s: Service) => {
    setSelectedService(s);
    setStep(2);
  }, []);

  const handleDateSelect = useCallback(async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setNoSlots(false);
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/business/availability?businessId=${businessId}&date=${date}`);
      const data = await res.json();

      if (data.slots && data.slots.length > 0) {
        setSlots(data.slots);
        setStep(3);
      } else {
        setSlots([]);
        setNoSlots(true);
      }
    } catch {
      setErrorMessage("Nie udało się sprawdzić dostępności. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const handleSlotSelect = useCallback((time: string) => {
    setSelectedSlot(time);
    setStep(4);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedService || !selectedDate || !selectedSlot || !customerName) return;

    setLoading(true);
    setErrorMessage("");

    const reservedAt = `${selectedDate}T${selectedSlot}:00.000Z`;

    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          reserved_at: reservedAt,
          service_type: selectedService.name,
          caller_name: customerName,
          caller_phone: customerPhone || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setStep("done");
      } else {
        setErrorMessage(data.error || "Wystąpił błąd podczas rezerwacji.");
        setStep("error");
      }
    } catch {
      setErrorMessage("Wystąpił błąd sieci. Spróbuj ponownie.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }, [selectedService, selectedDate, selectedSlot, customerName, customerPhone, notes, businessId]);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setSlots([]);
    setNoSlots(false);
    setErrorMessage("");
  }, []);

  function formatDateLabel(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pl-PL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-100">
        <div className="flex items-center justify-between gap-1">
          {steps.map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                  typeof step === "number" && step >= s
                    ? "bg-[#0d9488] text-white"
                    : step === "done" && s === 5
                    ? "bg-[#0d9488] text-white"
                    : "bg-brand-50 text-zinc-400"
                }`}
              >
                {step === "done" && s === 5 ? "✓" : s}
              </div>
              {s < 5 && (
                <div
                  className={`h-1 flex-1 mx-1 rounded transition-colors ${
                    typeof step === "number" && step > s
                      ? "bg-[#0d9488]"
                      : step === "done"
                      ? "bg-[#0d9488]"
                      : "bg-brand-50"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {step === "done" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Rezerwacja potwierdzona!</h2>
            <p className="text-zinc-500 mb-6">Szczegóły zostały wysłane SMS-em.</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0d3d3a] transition-colors"
            >
              Nowa rezerwacja
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Błąd rezerwacji</h2>
            <p className="text-red-500 mb-6">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0d3d3a] transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Wybierz usługę</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleServiceSelect(s)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedService?.id === s.id
                      ? "border-[#0d9488] bg-brand-50"
                      : "border-zinc-200 hover:border-[#0d9488]/30 hover:bg-[#f0fdfa]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-900">{s.name}</div>
                      {s.description && (
                        <div className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{s.description}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {s.price != null && (
                        <div className="font-bold text-[#0d9488]">{s.price} zł</div>
                      )}
                      <div className="text-xs text-zinc-400">{s.duration_minutes} min</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBack} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-zinc-900">Wybierz datę</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-4">Wybrana usługa: <span className="font-medium text-zinc-700">{selectedService?.name}</span></p>
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            />
            {loading && (
              <div className="text-center py-4 text-zinc-400 text-sm">Sprawdzanie dostępności...</div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBack} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-zinc-900">Wybierz godzinę</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Data: <span className="font-medium text-zinc-700">{selectedDate ? formatDateLabel(selectedDate) : ""}</span>
            </p>

            {noSlots && (
              <div className="text-center py-6">
                <p className="text-zinc-500 mb-4">Brak wolnych terminów w tym dniu.</p>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-[#0d9488] font-medium hover:underline"
                >
                  Wybierz inną datę
                </button>
              </div>
            )}

            {!noSlots && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotSelect(slot.time)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      selectedSlot === slot.time
                        ? "border-[#0d9488] bg-brand-50 text-brand-700"
                        : "border-zinc-200 text-zinc-700 hover:border-[#0d9488]/30 hover:bg-[#f0fdfa]"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBack} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-zinc-900">Twoje dane</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Imię i nazwisko <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+48 123 456 789"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jan@example.com"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Uwagi</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={() => {
                  if (!customerName.trim()) {
                    setErrorMessage("Imię i nazwisko jest wymagane.");
                    return;
                  }
                  setStep(5);
                }}
                className="w-full py-3 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0d3d3a] transition-colors"
              >
                Dalej &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBack} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-zinc-900">Potwierdź rezerwację</h2>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Usługa</span>
                <span className="font-medium text-zinc-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Data</span>
                <span className="font-medium text-zinc-900">{selectedDate ? formatDateLabel(selectedDate) : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Godzina</span>
                <span className="font-medium text-zinc-900">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Czas trwania</span>
                <span className="font-medium text-zinc-900">{selectedService?.duration_minutes} min</span>
              </div>
              {selectedService?.price != null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Cena</span>
                  <span className="font-bold text-[#0d9488]">{selectedService.price} zł</span>
                </div>
              )}
              <div className="border-t border-zinc-200 pt-3 flex justify-between">
                <span className="text-zinc-500 text-sm">Imię i nazwisko</span>
                <span className="font-medium text-zinc-900">{customerName}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Telefon</span>
                  <span className="font-medium text-zinc-900">{customerPhone}</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{errorMessage}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-[#0d9488] text-white rounded-lg font-medium hover:bg-[#0d3d3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? "Rezerwowanie..." : "Rezerwuj"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
