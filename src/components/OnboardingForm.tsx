"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const industries = [
  "Gastronomia",
  "Handel detaliczny",
  "Usługi",
  "E-commerce",
  "Transport",
  "Inne",
];

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    nip: "",
    industry: "",
    contactEmail: "",
    knowledgeBaseRaw: "",
  });

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: dbError } = await supabase.from("leads").insert({
      company_name: form.companyName,
      nip: form.nip,
      industry: form.industry,
      contact_email: form.contactEmail,
      knowledge_base_raw: form.knowledgeBaseRaw,
      status: "new",
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/?submitted=true");
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-brand-400 text-white"
                  : "bg-brand-50 text-zinc-400"
              }`}
            >
              {s}
            </div>
            <div className="h-px bg-brand-100 flex-1 last:hidden" />
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Dane firmy
          </h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nazwa firmy *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              placeholder="Nazwa Twojej firmy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              NIP *
            </label>
            <input
              type="text"
              value={form.nip}
              onChange={(e) => updateField("nip", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Branża
            </label>
            <select
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            >
              <option value="">Wybierz branżę</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Email kontaktowy *
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              placeholder="kontakt@firma.pl"
            />
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!form.companyName || !form.nip || !form.contactEmail}
            className="w-full bg-brand-400 text-white py-2.5 rounded-lg font-medium hover:bg-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dalej
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Baza wiedzy operacyjnej
          </h2>
          <p className="text-sm text-zinc-500">
            Wpisz wszystkie informacje, które bot głosowy musi znać, aby
            profesjonalnie obsługiwać Twoich klientów. Im więcej danych, tym
            lepiej.
          </p>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Cennik (produkty/usługi i ich ceny) *
            </label>
            <textarea
              value={form.knowledgeBaseRaw}
              onChange={(e) => updateField("knowledgeBaseRaw", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent h-48 resize-none"
              placeholder={`Przykład:
Pizza Margherita - 32 zł
Pizza Capriciosa - 38 zł
Pizza Pepperoni - 36 zł
Dostawa: 8 zł (powyżej 50 zł gratis)
Godziny otwarcia: pon-pt 10:00-22:00, sob-nd 12:00-23:00
Adres: ul. Główna 1, Warszawa
Telefon kontaktowy do szefa: 600 600 600`}
            />
          </div>
          <p className="text-xs text-zinc-400">
            Po 3 miesiącach każda zmiana w bazie wiedzy to opłata 100 PLN.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-brand-50 text-zinc-700 py-2.5 rounded-lg font-medium hover:bg-brand-100 transition"
            >
              Wstecz
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.knowledgeBaseRaw}
              className="flex-1 bg-brand-400 text-white py-2.5 rounded-lg font-medium hover:bg-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dalej
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">
            Podsumowanie
          </h2>
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Firma:</span> {form.companyName}
            </p>
            <p>
              <span className="font-medium">NIP:</span> {form.nip}
            </p>
            <p>
              <span className="font-medium">Branża:</span>{" "}
              {form.industry || "—"}
            </p>
            <p>
              <span className="font-medium">Email:</span> {form.contactEmail}
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Po wysłaniu formularza nasz zespół sprawdzi dane i skontaktuje się
            z Tobą w ciągu 24h.
          </p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-brand-50 text-zinc-700 py-2.5 rounded-lg font-medium hover:bg-brand-100 transition"
            >
              Wstecz
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-brand-400 text-white py-2.5 rounded-lg font-medium hover:bg-brand-500 transition disabled:opacity-50"
            >
              {loading ? "Wysyłanie..." : "Wyślij zgłoszenie"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




