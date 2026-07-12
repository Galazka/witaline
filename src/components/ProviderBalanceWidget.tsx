"use client";

import { useState, useEffect } from "react";

const GRANAT = "#050f1a";
const SZMARAGD = "#0d9488";

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4.938a1 1 0 011.591 1.183l-.367 3.879a1 1 0 01-1.987.217l-.367-3.879a1 1 0 011.987-.217l.367 3.879a1 1 0 00.59.816a1 1 0 001.39-1.039l-.367-3.879a1 1 0 011.987-.217l.367 3.879a1 1 0 00.59.816a1 1 0 001.39-1.039l-.367-3.879a1 1 0 011.987-.217l.367 3.879a1 1 0 00.59.816a1 1 0 001.39-1.039l-3.879-3.879a1 1 0 00-1.414-1.414l3.879 3.879z" />
  </svg>
);

const BatteryLowIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14c-1.657 0-3 .895-3 2v4a3 3 0 003 3h12a3 3 0 003-3v-4a3 3 0 00-3-3H6zM9 11V7a3 3 0 016 0v4M9 11h6" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
  </svg>
);

interface ProviderBalancesResponse {
  elevenLabs: {
    characters: number;
    alertLevel: "none" | "low" | "critical";
    alertMessage?: string;
  };
  twilio: {
    balance: number;
    alertLevel: "none" | "low" | "critical";
    alertMessage?: string;
  };
}

export default function ProviderBalanceWidget() {
  const [balances, setBalances] = useState<ProviderBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"elevenlabs" | "twilio">("elevenlabs");

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/provider-balances");
        if (!response.ok) throw new Error("Failed to fetch balances");
        const data = await response.json();
        setBalances(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 60000);
    return () => clearInterval(interval);
  }, []);

  const getAlertColor = (level: "none" | "low" | "critical") => {
    switch (level) {
      case "low":
        return { backgroundColor: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" };
      case "critical":
        return { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", color: "#991B1B" };
      default:
        return { backgroundColor: `${GRANAT}10`, borderColor: `${GRANAT}20`, color: GRANAT };
    }
  };

  const renderAlertIcon = (level: "none" | "low" | "critical") => {
    switch (level) {
      case "low":
        return <AlertCircleIcon className="w-4 h-4" />;
      case "critical":
        return <BatteryLowIcon className="w-4 h-4" />;
      default:
        return <CheckCircleIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Błąd ładowania: {error}</p>
        </div>
      </div>
    );
  }

  if (!balances) return null;

  const activeAlert = balances.elevenLabs.alertLevel !== "none" || balances.twilio.alertLevel !== "none";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Saldo Dostawców</h3>
        {activeAlert && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircleIcon className="w-4 h-4" />
            <span>Aktywne alerty</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("elevenlabs")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: activeTab === "elevenlabs" ? SZMARAGD : `${GRANAT}10`,
            color: activeTab === "elevenlabs" ? "#fff" : GRANAT,
          }}
        >
          ElevenLabs
        </button>
        <button
          onClick={() => setActiveTab("twilio")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: activeTab === "twilio" ? SZMARAGD : `${GRANAT}10`,
            color: activeTab === "twilio" ? "#fff" : GRANAT,
          }}
        >
          Twilio
        </button>
      </div>

      <div
        style={{
          borderRadius: "12px",
          border: "1px solid",
          padding: "16px",
          ...getAlertColor(activeTab === "elevenlabs" ? balances.elevenLabs.alertLevel : balances.twilio.alertLevel),
        }}
      >
        {activeTab === "elevenlabs" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Znaki pozostałe</span>
              {balances.elevenLabs.alertLevel !== "none" && 
                renderAlertIcon(balances.elevenLabs.alertLevel)
              }
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {balances.elevenLabs.characters.toLocaleString()}
            </div>
            {balances.elevenLabs.alertMessage && (
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>{balances.elevenLabs.alertMessage}</p>
            )}
          </div>
        )}

        {activeTab === "twilio" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Saldo USD</span>
              {balances.twilio.alertLevel !== "none" && 
                renderAlertIcon(balances.twilio.alertLevel)
              }
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${balances.twilio.balance.toFixed(2)}
            </div>
            {balances.twilio.alertMessage && (
              <p className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>{balances.twilio.alertMessage}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Aktualizacja: {new Date().toLocaleDateString("pl-PL")}
      </div>
    </div>
  );
}