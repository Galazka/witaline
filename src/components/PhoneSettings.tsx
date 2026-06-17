"use client";

import { useState } from "react";

interface Props {
  businessId: string;
  currentNumber: string | null;
  onNumberChanged: () => void;
}

export default function PhoneSettings({ businessId, currentNumber, onNumberChanged }: Props) {
  const [tab, setTab] = useState<"current" | "new" | "port">("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ phoneNumber: string; friendlyName: string; monthlyPrice: string; capabilities: { voice: boolean; sms: boolean } }[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [portNumber, setPortNumber] = useState("");
  const [portName, setPortName] = useState("");
  const [portNip, setPortNip] = useState("");
  const [portSaving, setPortSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch() {
    setSearching(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ country: "PL" });
      if (searchQuery) params.set("areaCode", searchQuery);
      const res = await fetch(`/api/twilio/search-numbers?${params}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.numbers || []);
      } else {
        setMessage(data.error || "Błąd wyszukiwania");
      }
    } catch {
      setMessage("Błąd połączenia z serwerem");
    }
    setSearching(false);
  }

  async function handlePortSubmit() {
    if (!portNumber || !portName) return;
    setPortSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/twilio/port-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          phoneNumber: portNumber,
          accountName: portName,
          nip: portNip,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Zgłoszenie przeniesienia numeru ${portNumber} zostało przyjęte. Skontaktujemy się w ciągu 24h.`);
        setPortNumber(""); setPortName(""); setPortNip("");
      } else if (res.status === 409) {
        setMessage(`Istnieje już aktywne zgłoszenie dla tego numeru.`);
      } else {
        setMessage(data.error || "Błąd wysyłania zgłoszenia");
      }
    } catch {
      setMessage("Błąd połączenia z serwerem");
    }
    setPortSaving(false);
  }

  async function handlePurchase(phoneNumber: string) {
    setPurchasing(true);
    setMessage("");
    try {
      const res = await fetch("/api/twilio/purchase-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, businessId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Numer ${phoneNumber} został przypisany!`);
        onNumberChanged();
      } else {
        setMessage(data.error || "Błąd zakupu numeru");
      }
    } catch {
      setMessage("Błąd połączenia z serwerem");
    }
    setPurchasing(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Numer telefonu</h3>
        <p className="text-sm text-zinc-500">
          Zarządzaj numerem telefonu, pod którym klienci dzwonią do Twojego asystenta AI.
        </p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes("Błąd") || message.includes("błąd") ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"}`}>
          {message}
        </div>
      )}

      {/* Current number display */}
      <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-zinc-200 p-5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Aktualny numer</p>
        {currentNumber ? (
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-zinc-900 font-mono">{currentNumber}</span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-600">
              Aktywny
            </span>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Brak przypisanego numeru. Wybierz nowy lub przenieś istniejący.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-50 p-1 rounded-lg">
        {(["new", "port"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition ${
              tab === t ? "bg-white/55 backdrop-blur-xl text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t === "new" ? "Kup nowy numer" : "Przenieś numer"}
          </button>
        ))}
      </div>

      {/* Buy new number */}
      {tab === "new" && (
        <div className="space-y-4">
          <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-zinc-200 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900">Wyszukaj dostępne numery</h4>
            <p className="text-xs text-zinc-500">
              Wybierz dedykowany numer polski (+48) z możliwością odbierania połączeń i SMS-ów.
            </p>
            <div className="flex gap-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kod kierunkowy (opcjonalnie, np. 22)"
                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white/60 backdrop-blur"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-5 py-2.5 bg-brand-400 text-white rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
              >
                {searching ? "Szukam..." : "Szukaj"}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-4 py-3 bg-white/55 backdrop-blur-xl border-b border-zinc-200">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dostępne numery</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {searchResults.map((num) => (
                  <div key={num.phoneNumber} className="px-4 py-3 flex items-center justify-between hover:bg-brand-50 transition">
                    <div>
                      <p className="font-mono font-semibold text-zinc-900">{num.phoneNumber}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Głos: {num.capabilities.voice ? "✓" : "✗"} | SMS: {num.capabilities.sms ? "✓" : "✗"} | {num.monthlyPrice} PLN/mies.
                      </p>
                    </div>
                    <button
                      onClick={() => handlePurchase(num.phoneNumber)}
                      disabled={purchasing}
                      className="px-4 py-2 bg-brand-400 text-white rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
                    >
                      {purchasing ? "Kupowanie..." : "Przypisz"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !searching && (
            <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
              <p className="text-sm text-zinc-400">Wpisz kod kierunkowy i kliknij "Szukaj" aby znaleźć dostępne numery.</p>
            </div>
          )}
        </div>
      )}

      {/* Port existing number */}
      {tab === "port" && (
        <div className="bg-white/55 backdrop-blur-xl rounded-xl border border-zinc-200 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900">Przenieś własny numer</h4>
          <p className="text-xs text-zinc-500">
            Przenieś swój istniejący numer do WitaLine. Proces przeniesienia trwa 1-5 dni roboczych.
            Potrzebujemy fakturę za numer od obecnego operatora i umowę.
          </p>
          <div className="space-y-3">
            <input
              value={portNumber}
              onChange={(e) => setPortNumber(e.target.value)}
              placeholder="Numer telefonu do przeniesienia (+48...)"
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-mono bg-white/60 backdrop-blur"
            />
            <input
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
              placeholder="Nazwa firmy / abonenta (jak na fakturze)"
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white/60 backdrop-blur"
            />
            <input
              value={portNip}
              onChange={(e) => setPortNip(e.target.value)}
              placeholder="NIP (jeśli faktura jest na firmę)"
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white/60 backdrop-blur"
            />
            <button
              onClick={handlePortSubmit}
              disabled={!portNumber || !portName || portSaving}
              className="w-full bg-brand-400 text-white py-2.5 rounded-lg font-medium hover:bg-brand-500 transition disabled:opacity-50"
            >
              {portSaving ? "Wysyłanie..." : "Wyślij zgłoszenie przeniesienia"}
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            Do przeniesienia numeru potrzebujemy: kopię faktury za numer od obecnego operatora, podpisany wniosek o przeniesienie.
            Skontaktujemy się z instrukcjami po wysłaniu zgłoszenia.
          </div>
        </div>
      )}
    </div>
  );
}
