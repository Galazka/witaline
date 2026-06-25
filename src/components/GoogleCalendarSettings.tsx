"use client";

import { useState, useEffect } from "react";

interface Props {
  businessId: string;
}

export default function GoogleCalendarSettings({ businessId }: Props) {
  const [connected, setConnected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/business/google/status?businessId=${businessId}`)
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected);
        setExpired(data.expired || false);
      })
      .catch((e) => console.error("[GoogleCalendarSettings] error:", e))
      .finally(() => setChecking(false));
  }, [businessId]);

  async function handleConnect() {
    try {
      const res = await fetch(`/api/business/google/auth?businessId=${businessId}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Błąd połączenia z serwerem");
    }
  }

  if (checking) return <p className="text-xs text-zinc-400">Sprawdzanie...</p>;

  return (
    <div className="bg-white rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-zinc-900">Google Calendar</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            {connected
              ? expired
                ? "Token wygasl — polacz ponownie"
                : "Polaczony — rezerwacje automatycznie trafiaja do Twojego kalendarza"
              : "Polacz konto Google aby synchronizowac rezerwacje"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected && !expired && (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Polaczone" />
          )}
          <button
            onClick={handleConnect}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              connected && !expired
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-brand-400 text-white hover:bg-brand-500"
            }`}
          >
            {connected && !expired ? "Polaczono" : "Polacz Google Calendar"}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-zinc-400">
        WitaLine potrzebuje dostepu tylko do tworzenia wydarzen w Twoim kalendarzu. Nie czyta ani nie modyfikuje istniejacych wydarzen.
      </p>
    </div>
  );
}
