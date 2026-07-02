"use client";

import { useState, useEffect } from "react";
import { getLocale, setLocale, initLocale, type Locale } from "@/lib/i18n";

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageSwitcher() {
  const [locale, setLocaleState] = useState<Locale>("pl");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initLocale();
    setLocaleState(getLocale());
  }, []);

  function switchLang(code: Locale) {
    setLocale(code);
    setLocaleState(code);
    setOpen(false);
    window.location.reload();
  }

  const current = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium px-2 py-1.5 rounded-lg hover:bg-[#f0fdfa]"
      >
        <span className="text-base">{current.flag}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-50 min-w-[140px]">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${locale === lang.code ? "bg-[#f0fdfa] text-[#0d9488] font-medium" : "text-zinc-500 hover:bg-[#f0fdfa]"}`}
              >
                <span className="text-base">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
