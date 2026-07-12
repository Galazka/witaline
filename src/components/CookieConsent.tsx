"use client";

import { useState, useEffect } from "react";

type Consent = "all" | "necessary" | null;

function setGtmConsent(consent: "granted" | "denied") {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.gtag) {
    w.gtag("consent", "update", {
      analytics_storage: consent,
      ad_storage: consent,
    });
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("witaline_cookie_consent");
    if (stored === "all" || stored === "necessary") {
      setGtmConsent(stored === "all" ? "granted" : "denied");
      return;
    }
    setVisible(true);
    setGtmConsent("denied");
  }, []);

  const accept = (value: "all" | "necessary") => {
    localStorage.setItem("witaline_cookie_consent", value);
    setVisible(false);
    setGtmConsent(value === "all" ? "granted" : "denied");
  };

  if (!visible) return null;

  const lang = typeof document !== "undefined" ? document.documentElement.lang || "pl" : "pl";
  const isEn = lang.startsWith("en");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl bg-gradient-to-br from-[#0c1929] via-[#0f1f33] to-[#14283e] text-white rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 text-sm text-white/80 leading-relaxed">
          {isEn
            ? "This site uses cookies for analytics and marketing purposes. By clicking 'Accept all' you consent to all cookies."
            : "Ta strona używa plików cookie w celach analitycznych i marketingowych. Klikając 'Akceptuję wszystkie' wyrażasz zgodę na wszystkie cookies."}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => accept("necessary")}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/20 rounded-xl hover:bg-white/5 transition-all"
          >
            {isEn ? "Necessary only" : "Tylko niezbędne"}
          </button>
          <button
            onClick={() => accept("all")}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] rounded-xl transition-all"
          >
            {isEn ? "Accept all" : "Akceptuję wszystkie"}
          </button>
        </div>
      </div>
    </div>
  );
}
