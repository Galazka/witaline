export type Locale = "pl" | "en";
export type TranslationKeys = keyof typeof translations.pl;

const LANG_KEY = "witaline_locale";

const landingPL = {
  hero: { title: "Automatyczna Recepcja AI", subtitle: "Twoja nowa recepcjonistka odbiera wszystkie połączenia 24/7, odpowiada na pytania, umawia rezerwacje i przekazuje do konsultanta tylko trudne sprawy.", cta: "Zobacz cennik", cta2: "Zadzwoń i sprawdź" },
  problem: { title: "Ile kosztuje Cię każde nieodebrane połączenie?", subtitle: "Każde połączenie, na które nie odpowiesz, to potencjalnie utracony klient.", items: [["Nawet 35% połączeń pozostaje nieodebranych — zwłaszcza po godzinach pracy i w weekendy."], ["Koszt konsultanta to średnio 5600 zł miesięcznie, a 40% rozmów to rutynowe pytania."], ["Klienci oczekują błyskawicznej odpowiedzi — 60% z nich rozłącza się po 30 sekundach oczekiwania."], ["Rotacja na stanowiskach obsługi klienta sięga 30% rocznie, a każdy nowy pracownik wymaga 3-miesięcznego wdrożenia."]] },
  benefits: { title: "Co zyskujesz", subtitle: "Wirtualna recepcja AI, która pracuje za Ciebie 24/7 — bez urlopów, zwolnień i błędów ludzkich.", items: [["Odbiera 100% połączeń", "Każde połączenie jest odebrane, nawet gdy wszyscy śpią. Bot pracuje 24/7/365."], ["Oszczędność etatu", "Bot przejmuje 80% rutynowych rozmów — odpowiada na pytania o cennik, godziny, adres, ofertę."], ["Natychmiastowa odpowiedź", "Średni czas odpowiedzi to poniżej 2 sekund. Żadnego czekania, żadnych komunikatów 'proszę czekać'."], ["Rezerwacje 24/7", "Rozmówca może umówić wizytę, zarezerwować stolik czy zamówić usługę — o dowolnej porze."], ["Integracja z Twoimi systemami", "Bot łączy się z Google Calendar, HubSpot, Livespace lub dowolnym API — automatycznie tworzy wpisy i notatki."], ["Analityka każdej rozmowy", "Transkrypcja, podsumowanie, wykryte intencje, nastroje klienta — wszystko w panelu administracyjnym."], ["Przekazywanie do konsultanta", "Gdy bot nie poradzi sobie z rozmową — płynnie przekazuje do człowieka z pełnym podsumowaniem."], ["Bezpieczeństwo i zgodność z RODO", "Wszystkie rozmowy są szyfrowane, przechowywane w UE. Zgodność z RODO i PCI DSS."]] },
  pricing: { title: "Prosta i elastyczna wycena", subtitle: "Płacisz tylko za to, czego potrzebujesz. Bez ukrytych kosztów, bez zobowiązań.", perMin: "Cena za minutę", monthly: "Miesięcznie", netto: "netto", brutto: "brutto", exclVat: "+23% VAT", inclVat: "z VAT", summary: "Podsumowanie kosztów", totalNetto: "Razem netto", totalBrutto: "Razem brutto", yourPlan: "Twój plan", rate: "Stawka", overage: "Nadwyżka", tryFree: "Rozpocznij darmowy test", noCard: "Bez karty · 7 dni za darmo", popular: "Najpopularniejszy", freeFor: "za darmo", minVoice: "min rozmów", perMinLabel: "PLN/min", overline: "Cennik", addons: "Dodatki opcjonalne", minutes: "Minuty", minuteSlider: "Ile minut miesięcznie?", minuteDesc: "Przesuń — cena spada z każdym progiem 500 minut", configurator: "Suwak minut", enterprise: "Indywidualnie", enterpriseTitle: "Indywidualne rozwiązanie dla Twojej firmy", enterpriseDesc: "Dedykowany onboarding z naszym zespołem, niestandardowe integracje, gwarancja SLA i wycena dopasowana do Twojej firmy.", startingFrom: "Cena od", setupFee: "Opłata wdrożeniowa", firstMonth: "Pierwszy miesiąc", callUs: "Zadzwoń — +48 732 125 752", seeOffer: "Zobacz ofertę indywidualną →", ownNumber: "Własny numer +48", ownNumberDesc: "Dedykowany numer telefonu", googleCalendar: "Google Calendar", googleCalendarDesc: "Bot sam umawia wizyty", crm: "Integracja CRM", crmDesc: "HubSpot, Livespace, Pipedrive", voiceClone: "Klon głosu", voiceCloneDesc: "Profesjonalny klon Twojego głosu", unlimitedConsultants: "Nielimitowani konsultanci", unlimitedConsultantsDesc: "Bez limitu przekierowań", prioritySupport: "Priorytetowe wsparcie", prioritySupportDesc: "Odpowiedź w 1h", sla247: "SLA 24/7", sla247Desc: "Gwarantowana dostępność", perMonth: "zł/mies", costBreakdown: "Podsumowanie kosztów" },
  faq: { title: "Najczęściej zadawane pytania", overline: "FAQ" },
  contact: { title: "Porozmawiajmy o Twojej firmie", subtitle: "Zostaw kontakt, a odezwiemy się w ciągu 24h z propozycją dopasowaną do Twojego biznesu.", phone: "+48 732 125 752", phoneDesc: "Zadzwoń i przetestuj asystenta", email: "hello@witaline.pl", emailDesc: "Napisz do nas", location: "Warszawa / Wrocław", locationDesc: "Jesteśmy w PL", formCompany: "Nazwa firmy", formCompanyPlaceholder: "np. Moja Firma Sp. z o.o.", formContact: "Imię i nazwisko", formContactPlaceholder: "np. Jan Kowalski", formWebsite: "Strona WWW", formWebsiteOptional: "opcjonalnie", formWebsitePlaceholder: "np. mojafirma.pl", formMessage: "Wiadomość", formMessagePlaceholder: "Opisz czego potrzebujesz...", formSubmit: "Wyślij zgłoszenie", formSuccess: "Dziękujemy!", formSuccessSub: "Odezwiemy się w ciągu 24h." }
};

const landingEN = {
  hero: { title: "AI-Powered Receptionist", subtitle: "Your new receptionist answers every call 24/7, handles inquiries, books appointments, and only forwards complex issues to your team.", cta: "See pricing", cta2: "Call and test" },
  problem: { title: "What does every missed call cost you?", subtitle: "Every unanswered call is a potential lost customer.", items: [["Up to 35% of calls go unanswered — especially after hours and weekends."], ["The cost of a human agent averages $1,400/mo, yet 40% of calls are routine questions."], ["Customers expect instant answers — 60% hang up after 30 seconds on hold."], ["Customer service turnover reaches 30% annually, and each new hire needs 3 months training."]] },
  benefits: { title: "What you gain", subtitle: "Virtual AI reception that works for you 24/7 — no vacations, sick days, or human errors.", items: [["Answers 100% of calls", "Every call is answered, even when everyone's asleep. The bot works 24/7/365."], ["Save a full-time salary", "Bot handles 80% of routine calls — pricing, hours, address, offers."], ["Instant response", "Average response time under 2 seconds. No waiting, no 'please hold'."], ["24/7 bookings", "Callers can book appointments, reserve tables, or order services anytime."], ["Integrates with your tools", "Connects to Google Calendar, HubSpot, Livespace, or any API — auto-creates entries."], ["Call analytics", "Transcription, summary, detected intents, sentiment — all in the admin panel."], ["Human handoff", "When the bot can't handle it — seamlessly transfers to a human with full context."], ["Secure & GDPR compliant", "All calls encrypted, stored in the EU. GDPR and PCI DSS compliant."]] },
  pricing: { title: "Simple & flexible pricing", subtitle: "Pay only for what you need. No hidden fees, no commitments.", perMin: "Per minute", monthly: "Monthly", netto: "net", brutto: "gross", exclVat: "excl. VAT", inclVat: "incl. VAT", summary: "Cost breakdown", totalNetto: "Total net", totalBrutto: "Total gross", yourPlan: "Your plan", rate: "Rate", overage: "Overage", tryFree: "Start free trial", noCard: "No card · 7 days free", popular: "Most popular", freeFor: "free", minVoice: "voice min", perMinLabel: "PLN/min", overline: "Pricing", addons: "Optional add-ons", minutes: "Minutes", minuteSlider: "How many minutes per month?", minuteDesc: "Slide — price drops with every 500-minute tier", configurator: "Minute slider", enterprise: "Enterprise", enterpriseTitle: "Custom solution for your business", enterpriseDesc: "Dedicated onboarding with our team, custom integrations, SLA guarantee, and pricing tailored to your company size.", startingFrom: "Starting from", setupFee: "Setup fee", firstMonth: "First month", callUs: "Call us — +48 732 125 752", seeOffer: "See enterprise offer →", ownNumber: "Own number +48", ownNumberDesc: "Dedicated phone number", googleCalendar: "Google Calendar", googleCalendarDesc: "Bot books appointments automatically", crm: "CRM Integration", crmDesc: "HubSpot, Livespace, Pipedrive", voiceClone: "Voice clone", voiceCloneDesc: "Professional clone of your voice", unlimitedConsultants: "Unlimited consultants", unlimitedConsultantsDesc: "No transfer limits", prioritySupport: "Priority support", prioritySupportDesc: "1h response time", sla247: "SLA 24/7", sla247Desc: "Guaranteed availability", perMonth: "PLN/mo", costBreakdown: "Cost breakdown" },
  faq: { title: "Frequently asked questions", overline: "FAQ" },
  contact: { title: "Let's talk about your business", subtitle: "Leave your contact and we'll get back within 24h with a tailored proposal.", phone: "+48 732 125 752", phoneDesc: "Call and test the assistant", email: "hello@witaline.pl", emailDesc: "Email us", location: "Warsaw / Wroclaw", locationDesc: "We're in PL", formCompany: "Company name", formCompanyPlaceholder: "e.g. My Company LLC", formContact: "Full name", formContactPlaceholder: "e.g. John Doe", formWebsite: "Website", formWebsiteOptional: "optional", formWebsitePlaceholder: "e.g. mycompany.com", formMessage: "Message", formMessagePlaceholder: "Describe what you need...", formSubmit: "Send inquiry", formSuccess: "Thank you!", formSuccessSub: "We'll get back within 24h." }
};

const translations = {
  pl: { ...landingPL, title: "WitaLine – Recepcja AI", welcome: "Witamy w WitaLine", login: "Zaloguj się", register: "Zarejestruj się", dashboard: "Panel", calls: "Połączenia", reservations: "Rezerwacje", sms: "Wiadomości", leads: "Leads", config: "Ustawienia", upgrade: "Cennik", account: "Konto", security: "Bezpieczeństwo", overview: "Przegląd", voice: "Voice" },
  en: { ...landingEN, title: "WitaLine AI Reception", welcome: "Welcome to WitaLine", login: "Login", register: "Register", dashboard: "Dashboard", calls: "Calls", reservations: "Reservations", sms: "SMS", leads: "Leads", config: "Settings", upgrade: "Pricing", account: "Account", security: "Security", overview: "Overview", voice: "Voice" }
};

export const translations_raw = (locale?: string): Record<string, any> => translations[locale || currentLocale] || translations.pl;

let currentLocale: Locale = "pl";

export function initLocale(locale?: Locale) {
  if (locale) currentLocale = locale;
  else {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
    if (stored === "en" || stored === "pl") currentLocale = stored;
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try { localStorage.setItem(LANG_KEY, locale); } catch {}
}

export function t(key?: string, locale?: Locale): any {
  const l = locale || currentLocale;
  if (!key) return translations[l] || translations.pl;
  const keys = key.split(".");
  let val: any = translations[l] || translations.pl;
  for (const k of keys) {
    if (val && typeof val === "object" && k in val) {
      val = val[k];
    } else {
      return key;
    }
  }
  return val ?? key;
}
