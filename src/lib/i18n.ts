export type Locale = "pl" | "en";
export type TranslationKeys = keyof typeof translations.pl;

const translations: Record<string, Record<string, string>> = {
  pl: { title: "WitaLine – Recepcja AI", welcome: "Witamy w WitaLine", login: "Zaloguj się", register: "Zarejestruj się", dashboard: "Panel", calls: "Połączenia", reservations: "Rezerwacje", sms: "Wiadomości", leads: "Leads", config: "Ustawienia", upgrade: "Cennik", account: "Konto", security: "Bezpieczeństwo", overview: "Przegląd", voice: "Voice" },
  en: { title: "WitaLine AI Reception", welcome: "Welcome to WitaLine", login: "Login", register: "Register", dashboard: "Dashboard", calls: "Calls", reservations: "Reservations", sms: "SMS", leads: "Leads", config: "Settings", upgrade: "Pricing", account: "Account", security: "Security", overview: "Overview", voice: "Voice" }
};

export const translations_raw = translations;

let currentLocale: Locale = "pl";

export function initLocale(locale?: Locale) {
  if (locale) currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key?: string, locale?: Locale): any {
  const l = locale || currentLocale;
  if (!key) return translations[l] || translations.pl;
  return translations[l]?.[key] || translations["pl"]?.[key] || key;
}