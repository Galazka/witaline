"use client";

import { useState, useEffect } from "react";
import { AlertCircle, BatteryLow, CheckCircle } from "lucide-react";

interface ProviderBalance {
  provider: "elevenlabs" | "twilio";
  balance: number;
  alertLevel: "none" | "low" | "critical";
  alertMessage?: string;
}

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
        return "text-amber-500 bg-amber-50 border-amber-200";
      case "critical":
        return "text-red-500 bg-red-50 border-red-200";
      default:
        return "text-granat bg-granat/10 border-granat/20";
    }
  };

  const getAlertIcon = (level: "none" | "low" | "critical") => {
    switch (level) {
      case "low":
        return AlertCircle;
      case "critical":
        return BatteryLow;
      default:
        return CheckCircle;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-granat/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-granat/20 rounded w-1/3"></div>
          <div className="h-40 bg-granat/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-granat/20 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-granat mx-auto mb-4" />
          <p className="text-granat/60">Błąd ładowania: {error}</p>
        </div>
      </div>
    );
  }

  if (!balances) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-granat/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-granat">Saldo Dostawców</h3>
        {balances.elevenLabs.alertLevel !== "none" || balances.twilio.alertLevel !== "none" && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Aktywne alerty</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("elevenlabs")}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === "elevenlabs"
              ? "bg-szmaragd text-white"
              : "bg-granat/10 text-granat hover:bg-granat/20"
          }`}
        >
          ElevenLabs
        </button>
        <button
          onClick={() => setActiveTab("twilio")}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === "twilio"
              ? "bg-szmaragd text-white"
              : "bg-granat/10 text-granat hover:bg-granat/20"
          }`}
        >
          Twilio
        </button>
      </div>

      <div
        className={`rounded-lg border p-4 ${getAlertColor(
          activeTab === "elevenlabs" ? balances.elevenLabs.alertLevel : balances.twilio.alertLevel
        )}`}
      >
        {activeTab === "elevenlabs" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-granat/70">Znaki pozostałe</span>
              {balances.elevenLabs.alertLevel !== "none" && (
                <getAlertIcon(balances.elevenLabs.alertLevel) className="w-4 h-4" />
              )}
            </div>
            <div className="text-2xl font-bold text-granat mb-2">
              {balances.elevenLabs.characters.toLocaleString()}
            </div>
            {balances.elevenLabs.alertMessage && (
              <p className="text-xs">{balances.elevenLabs.alertMessage}</p>
            )}
          </div>
        )}

        {activeTab === "twilio" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-granat/70">Saldo USD</span>
              {balances.twilio.alertLevel !== "none" && (
                <getAlertIcon(balances.twilio.alertLevel) className="w-4 h-4" />
              )}
            </div>
            <div className="text-2xl font-bold text-granat mb-2">
              ${balances.twilio.balance.toFixed(2)}
            </div>
            {balances.twilio.alertMessage && (
              <p className="text-xs">{balances.twilio.alertMessage}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-granat/50">
        Aktualizacja: {new Date().toLocaleDateString("pl-PL")}
      </div>
    </div>
  );
}