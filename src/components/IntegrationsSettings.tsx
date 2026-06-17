"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
}

export default function IntegrationsSettings({ businessId }: Props) {
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testSmsStatus, setTestSmsStatus] = useState("");

  useEffect(() => {
    fetch(`/api/calendar/check?businessId=${businessId}&date=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setCalendarConnected(true);
          setCalendarEmail(data.calendarEmail || "connected");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  function handleConnectCalendar() {
    window.location.href = `/api/calendar/auth?businessId=${businessId}`;
  }

  async function handleDisconnectCalendar() {
    await fetch("/api/calendar/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    setCalendarConnected(false);
    setCalendarEmail("");
  }

  async function handleTestSms() {
    if (!testSmsPhone) return;
    setTestSmsStatus("sending");
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: testSmsPhone,
        message: "To jest testowa wiadomość z WitaLine! Twoja recepcja AI działa poprawnie.",
      }),
    });
    setTestSmsStatus(res.ok ? "sent" : "error");
    setTimeout(() => setTestSmsStatus(""), 3000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Google Calendar */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          Google Calendar
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Podłącz kalendarz, aby asystent AI mógł sprawdzać dostępność i
          automatycznie rezerwować terminy.
        </p>

        {loading ? (
          <p className="text-sm text-zinc-400">Sprawdzanie...</p>
        ) : calendarConnected ? (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-500">
                Kalendarz podłączony
              </p>
              <p className="text-xs text-brand-600">{calendarEmail}</p>
            </div>
            <button
              onClick={handleDisconnectCalendar}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              Rozłącz
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectCalendar}
            className="bg-white border border-zinc-200 text-zinc-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-50 transition inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
            </svg>
            Połącz Google Calendar
          </button>
        )}
      </div>

      {/* SMS */}
      <div className="border-t border-zinc-200 pt-8">
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          Powiadomienia SMS
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Asystent AI może wysyłać potwierdzenia rezerwacji, przypomnienia i
          ankiety satysfakcji SMS-em.
        </p>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-zinc-600">Testuj połączenie SMS:</p>
          <div className="flex gap-2">
            <input
              placeholder="+48 123 456 789"
              value={testSmsPhone}
              onChange={(e) => setTestSmsPhone(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-500 placeholder:text-zinc-400 transition"
            />
            <button
              onClick={handleTestSms}
              disabled={!testSmsPhone || testSmsStatus === "sending"}
              className="bg-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
            >
              {testSmsStatus === "sending" ? "Wysyłanie..." : "Wyślij test"}
            </button>
          </div>
          {testSmsStatus === "sent" && (
            <p className="text-xs text-brand-600">SMS wysłany!</p>
          )}
          {testSmsStatus === "error" && (
            <p className="text-xs text-red-500">
              Błąd. Sprawdź konfigurację Twilio w .env.local
            </p>
          )}
        </div>
      </div>

      {/* Co jest wysyłane */}
      <div className="border-t border-zinc-200 pt-8">
        <h4 className="text-sm font-semibold text-zinc-900 mb-3">
          Automatyczne wiadomości
        </h4>
        <div className="space-y-3 text-sm text-zinc-500">
          <div className="bg-white rounded-xl p-4">
            <p className="font-medium text-zinc-700 mb-1">
              Potwierdzenie rezerwacji
            </p>
            <p className="text-xs">
              Wysyłane automatycznie po umówieniu wizyty przez asystenta.
              Zawiera datę, godzinę, usługę.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="font-medium text-zinc-700 mb-1">
              Przypomnienie 24h przed
            </p>
            <p className="text-xs">
              Klient dostaje SMS dzień przed wizytą z prośbą o potwierdzenie
              lub odwołanie.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="font-medium text-zinc-700 mb-1">
              Ankieta po rozmowie
            </p>
            <p className="text-xs">
              Po zakończeniu rozmowy klient dostaje SMS z linkiem do ankiety
              satysfakcji (ocena 1-5).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




