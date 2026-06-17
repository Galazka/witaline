"use client";

import { useState, useEffect } from "react";
import { t, getLocale, setLocale, type Locale, type TranslationKeys } from "@/lib/i18n";

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>("pl");
  const [translations, setTranslations] = useState<TranslationKeys>(t());

  useEffect(() => {
    const current = getLocale();
    setLocaleState(current);
    setTranslations(t());
  }, []);

  function changeLocale(newLocale: Locale) {
    setLocale(newLocale);
    setLocaleState(newLocale);
    setTranslations(t());
  }

  return { locale, t: translations, setLocale: changeLocale };
}
