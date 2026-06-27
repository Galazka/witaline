"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import FloatingWidget from "@/components/FloatingWidget";
import DemoAudioPlayer from "@/components/DemoAudioPlayer";
import SavingsCalculator from "@/components/SavingsCalculator";
import { WITALINE_PHONE_NUMBER, WITALINE_PHONE_DISPLAY } from "@/lib/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PricingSection from "@/components/PricingSection";
import { t, initLocale, getLocale, translations_raw, type Locale } from "@/lib/i18n";
import { BuildingIcon, PhoneIcon, BankIcon, LightningIcon, StarIcon, HeartIcon, WriteIcon, LinkIcon, BotIcon, MicIcon, BrainIcon, CloudIcon, HeadphonesIcon, EnvelopeIcon, PinIcon, ShieldIcon } from "@/components/ui/Icons";

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const faqItems = [
  { q: "Co to są tokeny?", a: "Tokeny to jednostki przetwarzania rozmowy. 1 minuta rozmowy głosowej zużywa około 1000 tokenów. Chat i widget na stronie zużywają minimalne ilości — dlatego są nielimitowane w każdym planie." },
  { q: "Jak asystent rozumie klienta?", a: "Kiedy ktoś dzwoni, głos jest zamieniany na tekst w czasie rzeczywistym przez zaawansowany silnik rozpoznawania mowy. Model językowy analizuje intencje — czy to pytanie o ofertę, zamówienie, rezerwację. Następnie generuje odpowiedź, która jest odczytywana przez syntezator mowy. Cały cykl trwa poniżej 2 sekund." },
  { q: "Czy asystent brzmi naturalnie?", a: "Tak. Nasze głosy są uznawane za najbardziej naturalne na rynku — w testach użytkownicy regularnie mylą je z żywymi ludźmi. Latencja odpowiedzi to poniżej 100 ms, a pełny cykl zamiany mowy na odpowiedź zajmuje poniżej 2 sekund. Możesz zadzwonić i sprawdzić: +48 732 125 752." },
  { q: "Jak bot radzi sobie z emocjami klienta?", a: "Model językowy wykrywa nastroje i emocje w tekście. Jeśli klient jest zdenerwowany, bot może spowolnić tempo, użyć bardziej empatycznych sformułowań, a w razie potrzeby — przekazać rozmowę do konsultanta." },
  { q: "Co gdy asystent nie poradzi sobie z rozmową?", a: "Asystent rozpoznaje swoje ograniczenia. Po kilku nieudanych próbach mówi: 'Przepraszam, nie do końca rozumiem. Już łączę Pana/Panią z doradcą' i przekazuje rozmowę do człowieka. Ty dostajesz podsumowanie." },
  { q: "Jak szybko mogę uruchomić system?", a: "Uruchomienie zajmuje 15 minut. Rejestrujesz się, przekierowujesz nieodebrane połączenia na nasz numer. Resztę robimy my. Dla planów Enterprise oferujemy dedykowany onboarding z zespołem wdrożeniowym (2-3 tygodnie)." },
  { q: "Z jakimi systemami się integrujecie?", a: "Natywnie: Google Calendar, HubSpot, Livespace, Pipedrive. Przez API możemy zintegrować się z dowolnym CRM, ERP lub systemem rezerwacji. Dla klientów Enterprise — niestandardowe integracje." },
  { q: "Czy mogę przenieść swój numer?", a: "Tak. W modelu Self-Service możesz otrzymać nowy numer lub przenieść istniejący. Proces przenoszenia trwa do 5 dni roboczych. W modelu Enterprise przenosimy numer w ramach onboardingu." },
  { q: "Jakie jezyki obslugujecie?", a: "Polski i angielski. Mozemy dodac kolejny jezyk na zyczenie klienta. W planie Enterprise uruchamiamy dowolna konfiguracje jezykowa." },
  { q: "Co z ochroną danych i RODO?", a: "WitaLine działa na europejerskich serwerach (Google Cloud, region Frankfurt). Każda rozmowa poprzedzona jest komunikatem o nagrywaniu i zgodzie. Nagrania przechowujemy maksymalnie 30 dni. Pełna zgodność z RODO. Dla Enterprise — umowa powierzenia danych i audyt bezpieczeństwa." },
  { q: "Ile kosztuje wdrożenie dla mojej firmy?", a: "Skorzystaj z konfiguratora w zakładce cennik — wybierz minuty i dodatki, zobaczysz cenę od ręki. Dla firm powyżej 10 konsultantów polecamy plan Enterprise z indywidualną wyceną i dedykowanym onboardingiem." },
  { q: "Musicie wiedzieć wszystko o mojej firmie?", a: "Nie. Wystarczy baza wiedzy: cennik, godziny otwarcia, menu produktów. Resztę bot wyciąga z rozmowy. Dla bardziej zaawansowanych potrzeb — konfigurujesz własnego prompta." },
];

const caseStudies = [
  {
    icon: "building",
    title: "Agencja nieruchomości",
    domain: "400 rozmów dziennie",
    challenge: "40% połączeń to pytania o dostępność lokali i chęć umówienia oglądania. Po 18:00 agenci nie odbierali, więc ~30% leadów przepadało na poczcie głosowej.",
    solution: "Wirtualna recepcjonistka z profesjonalnie sklonowanym glosem wlasciciela. Integracja z baza nieruchomosci i kalendarzem.",
    results: [
      "Asystent odbiera 95% połączeń",
      "40% wizyt rezerwowanych poza godzinami pracy",
      "Koszt: ~390 zł/mies vs 5600 zł etatu",
      "Zwrot inwestycji w 6 tygodni",
    ],
  },
  {
    icon: "phone",
    title: "Call center e-commerce",
    domain: "2000 rozmów dziennie",
    challenge: "Prawie połowa zapytań dotyczy statusu zamówienia i reklamacji. Długi czas oczekiwania (>8 min) frustrował klientów, duża rotacja pracowników.",
    solution: "Asystent przejmuje pierwszą linię obsługi, integracja z systemem zamówień i CRM. Automatyczne sprawdzanie statusu, generowanie zwrotów, eskalacja do konsultanta.",
    results: [
      "Asystent rozwiązuje 65% spraw od A do Z",
      "Średni czas rozmowy spadł z 8 do 3 min",
      "Koszty operacyjne niższe o 55%",
      "Rotacja konsultantów spadła o 40%",
    ],
  },
  {
    icon: "bank",
    title: "Biuro rachunkowe",
    domain: "150 rozmów dziennie",
    challenge: "Sezonowo (PIT/ VAT) liczba połączeń rośnie 5-krotnie. Klienci dzwonią po godz. 16:00, w weekendy. Każde nieodebrane połączenie to ryzyko utraty klienta.",
    solution: "Asystent rozpoznaje intencje: 'terminy rozliczeń', 'potrzebuję faktury', 'chcę zmienić księgową'. Dla stałych klientów — weryfikacja przez NIP i dostęp do dokumentów.",
    results: [
      "Asystent odbiera 100% połączeń 24/7",
      "70% rozmów rozwiązanych bez udziału człowieka",
      "W sezonie PIT obsługa bez dodatkowego zatrudnienia",
      "Klienci chwalą dostępność o dowolnej porze",
    ],
  },
];

import { blogPosts as blogPostsData } from "@/lib/blog";

const blogPosts = blogPostsData.map((p) => ({
  title: p.title,
  desc: p.excerpt,
  date: p.date,
  readTime: p.readTime,
  href: `/blog/${p.slug}`,
}));

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

function AnimatedSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  return (
    <section ref={ref} id={id} className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className ?? ""}`}>
      {children}
    </section>
  );
}

const AnimatedDiv = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div className={`transition-all duration-600 ease-out ${className ?? ""}`} style={{ opacity: 0, animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards` }}>
    {children}
  </div>
);

function FaqSection({ faqItems: items, locale }: { faqItems: { q: string; a: string }[]; locale: Locale }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 6);

  return (
    <div className="grid lg:grid-cols-3 gap-8 lg:gap-10 items-start">
      <div className="lg:col-span-2 space-y-3">
        {visible.map((item, i) => (
          <details key={item.q} className="group bg-white border border-zinc-200 rounded-2xl hover:border-brand-200 hover:shadow-sm transition-all open:border-brand-200 open:shadow-sm">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-medium text-zinc-900 select-none">
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-brand-50 text-[#0d9488] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {item.q}
              </span>
              <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="px-5 pb-4 pt-3 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100">{item.a}</div>
          </details>
        ))}
        {items.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center py-3 text-sm font-medium text-[#0d9488] hover:text-[#0d9488] bg-white border border-dashed border-zinc-200 rounded-2xl hover:border-brand-200 transition-all"
          >
            {showAll
              ? (locale === "en" ? "Show less ↑" : "Pokaż mniej ↑")
              : (locale === "en" ? `Show all ${items.length} questions ↓` : `Pokaż wszystkie ${items.length} pytań ↓`)}
          </button>
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#0d9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-900 mb-1">{locale === "en" ? "Still have questions?" : "Masz więcej pytań?"}</p>
          <p className="text-xs text-zinc-500 mb-4">{locale === "en" ? "We reply within 15 minutes" : "Oddzwonimy w 15 minut"}</p>
          <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="block w-full bg-[#0d9488] text-white py-2.5 rounded-xl font-medium text-sm hover:bg-[#0f766e] transition mb-2">{WITALINE_PHONE_DISPLAY}</a>
          <a href="#kontakt" className="block w-full text-zinc-600 py-2.5 rounded-xl font-medium text-sm border border-zinc-200 hover:border-zinc-300 hover:bg-[#f0fdfa] transition">{locale === "en" ? "Write to us" : "Napisz do nas"}</a>
        </div>

        <div className="bg-gradient-to-br from-[#0d9488] to-[#0f766e] rounded-2xl p-6 text-white text-center">
          <p className="text-2xl font-bold font-display">7 dni</p>
          <p className="text-sm text-white/70">{locale === "en" ? "free trial" : "darmowego testu"}</p>
          <p className="text-xs text-white/50 mt-2">{locale === "en" ? "No card required" : "Bez karty kredytowej"}</p>
          <div className="mt-4 h-px bg-white/10" />
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/70">
            <span>✓ Bez umowy</span>
            <span>✓ Anuluj kiedy chcesz</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 bg-white border border-zinc-200 rounded-2xl p-4">
          <span className="flex items-center gap-1.5"><StarIcon className="w-3.5 h-3.5 text-amber-400" /> 5.0</span>
          <span className="flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5 text-zinc-400" /> 15k+ rozmów</span>
          <span className="flex items-center gap-1.5"><ShieldIcon className="w-3.5 h-3.5 text-[#0d9488]" /> RODO</span>
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const tr = t();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !contact.trim() || !message.trim()) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: company.trim(), contact: contact.trim(), message: message.trim(), website: website.trim() || undefined }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Błąd wysyłania"); }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać.");
    } finally { setSending(false); }
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{tr.contact.formSuccess}</h3>
      <p className="text-sm text-white/60">{tr.contact.formSuccessSub}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">{tr.contact.formCompany} <span className="text-red-400">*</span></label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder={tr.contact.formCompanyPlaceholder} required className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]/50 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">{tr.contact.formContact} <span className="text-red-400">*</span></label>
          <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder={tr.contact.formContactPlaceholder} required className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]/50 transition" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">{tr.contact.formWebsite} <span className="text-white/30">{tr.contact.formWebsiteOptional}</span></label>
        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder={tr.contact.formWebsitePlaceholder} className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]/50 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">{tr.contact.formMessage} <span className="text-red-400">*</span></label>
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder={tr.contact.formMessagePlaceholder} required className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]/50 transition resize-y" />
      </div>
      {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl">{error}</p>}
      <button type="submit" disabled={sending} className="btn-primary w-full">
        {sending ? "Wysyłanie..." : tr.contact.formSubmit}
      </button>
    </form>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localeState, setLocaleState] = useState<Locale>("pl");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    initLocale();
    setLocaleState(getLocale());
  }, []);

  const tr = translations_raw(localeState);

  return (
    <div className="flex flex-col flex-1">
      {/* ===  DECORATIVE BG ELEMENTS === */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-[#0d9488]/5 to-[#0d9488]/2 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -left-40 w-[400px] h-[400px] bg-gradient-to-tr from-[#0d9488]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-gradient-to-bl from-[#0d9488]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.08)_0%,transparent_70%)] rounded-full" />
      </div>

      {/* === TOP BAR === */}
      <nav className="sticky top-0 z-50 bg-[#0c1929] border-b border-white/5">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#0d9488]/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/"><Logo size="sm" withTagline={false} /></Link>
            <div className="hidden lg:flex items-center gap-1 text-sm">
              {["Jak działa", "Technologia", "Wdrożenia", "Cennik", "FAQ", "Blog", "Kontakt"].map((label, i) => (
                <a key={label} href={`#${["jak-dziala","technologia","case-studies","cennik","faq","blog","kontakt"][i]}`} className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all font-medium">
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
              aria-label={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:inline-flex text-sm text-zinc-300 hover:text-white transition-colors font-medium px-3 py-2">Zaloguj</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Startowy 7 dni</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors" aria-label="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#0c1929]/95 backdrop-blur-xl px-4 py-4 space-y-1 text-sm animate-fade-in-down">
            {[["#jak-dziala", "Jak działa"], ["#technologia", "Technologia"], ["#case-studies", "Wdrożenia"], ["#cennik", "Cennik"], ["#faq", "FAQ"], ["#blog", "Blog"], ["#kontakt", "Kontakt"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-white/5 hover:text-white font-medium transition-colors">{label}</a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-zinc-300 font-medium hover:bg-white/5 sm:hidden">Zaloguj</Link>
          </div>
        )}
      </nav>

      {/* === HERO === */}
      <AnimatedSection className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1929] via-[#0f1f33] to-[#14283e] pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#0d9488]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-[#0d9488]/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedDiv delay={0}>
              <div className="inline-flex items-center gap-2 bg-[#0d9488]/10 border border-[#0d9488]/20 text-[#14b8a6] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm shadow-[#0d9488]/10">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-[#0d9488] animate-ping opacity-40" />
                  <span className="relative rounded-full bg-[#0d9488] w-2 h-2" />
                </span>
                Odbieramy 24/7 — wypróbuj za darmo
              </div>
            </AnimatedDiv>
            <AnimatedDiv delay={80}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-display tracking-tight leading-[1.05] mb-6">
                Automatyczna recepcja, która <br className="hidden sm:block" /><span className="gradient-text">odbiera za Ciebie</span>
              </h1>
            </AnimatedDiv>
            <AnimatedDiv delay={160}>
              <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Twój asystent głosowy odbiera połączenia, odpowiada na pytania, przyjmuje zamówienia i rezerwacje.
                <br className="hidden sm:block" /> Konfiguracja w 3 minuty, zero ryzyka.
              </p>
            </AnimatedDiv>
            <AnimatedDiv delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-[#0d9488]/20 hover:shadow-xl hover:shadow-[#0d9488]/25 transition-all duration-300">
                  Rozpocznij 7-dniowy trial
                </Link>
                <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="inline-flex items-center gap-2.5 border border-zinc-500 text-zinc-300 hover:border-[#0d9488]/30 hover:text-[#14b8a6] hover:bg-[#0d9488]/5 rounded-xl px-6 py-3.5 transition-all group">
                  <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
                    <span className="relative rounded-full bg-green-500 w-2.5 h-2.5" />
                  </span>
                  <span className="text-base font-semibold">{WITALINE_PHONE_DISPLAY}</span>
                </a>
              </div>
            </AnimatedDiv>
            <AnimatedDiv delay={320}>
              <div className="mt-4 text-xs text-zinc-500 flex items-center justify-center gap-4">
                <span>Połączenie wg taryfy operatora</span>
                <span className="w-1 h-1 rounded-full bg-zinc-500" />
                <span>Bez dodatkowych opłat</span>
              </div>
            </AnimatedDiv>
          </div>
        </div>

        {/* Dashboard screenshot mockup */}
        <AnimatedDiv delay={400} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative">
          <div className="card-lift bg-white rounded-2xl border border-zinc-200/60 shadow-xl shadow-zinc-200/40 overflow-hidden glow-lg">
            <div className="bg-zinc-50/90 border-b border-zinc-200/50 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono ml-2 tracking-wide">Panel WitaLine — statystyki</span>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Odebranych rozmów", "1,247", "w tym miesiącu", "text-[#0d9488]"],
                ["Średni czas", "1m 42s", "spadek o 23%", "text-green-600"],
                ["Rozpoznanych intencji", "94.2%", "wzrost o 5.1%", "text-green-600"],
                ["Oszczędności", "~4,200 zł", "vs koszt etatu", "text-[#0d9488]"],
              ].map(([label, value, sub, color]) => (
                <div key={label} className="bg-zinc-50 rounded-xl p-3 md:p-4 hover:bg-[#0d9488]/5 transition-colors">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{label}</p>
                  <p className={`text-xl md:text-2xl font-bold ${color} font-display mt-1`}>{value}</p>
                  <p className="text-[10px] text-zinc-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedDiv>
      </AnimatedSection>

      {/* === TRUST BAR === */}
      <AnimatedSection className="bg-gradient-to-r from-white via-brand-50/10 to-white border-b border-zinc-100 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-zinc-400 stagger">
            <span className="text-zinc-500 font-semibold text-xs uppercase tracking-widest">Zaufany przez</span>
            {[
              ["building", "200+ firm"],
              ["phone", "15 000+ rozmów/mies"],
              ["lightning", "<2s odpowiedź"],
              ["star", "5.0 średnia"],
              ["heart", "Autoryzowany partner"],
            ].map(([icon, text]) => (
              <span key={text} className="flex items-center gap-2 text-zinc-500">
                <span className="text-zinc-400">{icon === "building" ? <BuildingIcon className="w-4 h-4" /> : icon === "phone" ? <PhoneIcon className="w-4 h-4" /> : icon === "lightning" ? <LightningIcon className="w-4 h-4" /> : icon === "star" ? <StarIcon className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}</span>
                <span className="font-medium">{text}</span>
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* === JAK DZIAŁA === */}
      <AnimatedSection id="jak-dziala" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50/20 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Jak działa</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Twój asystent w <span className="gradient-text">3 krokach</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Ustaw przekierowanie nieodebranych — asystent głosowy robi resztę</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-16 stagger">
              {[
                { step: "1", title: "Rejestracja i konfiguracja", desc: "Kliknij \"Start\" i skonfiguruj swój plan w minutę. Darmowy trial 7 dni bez podawania karty.", icon: "write" },
                { step: "2", title: "Przekieruj połączenia", desc: "Ustaw przekierowanie nieodebranych na numer WitaLine. Zajmuje 30 sekund u operatora.", icon: "link" },
                { step: "3", title: "Asystent odbiera 24/7", desc: "Asystent rozmawia z klientami, zbiera leady, przyjmuje zamówienia. Raport na email każdego ranka.", icon: "bot" },
              ].map((item) => (
                <div key={item.step} className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200 hover:shadow-lg hover:shadow-[#0d9488]/10 transition-all">
                  <span className="text-[#0d9488] mb-4 block">{item.icon === "write" ? <WriteIcon className="w-7 h-7" /> : item.icon === "link" ? <LinkIcon className="w-7 h-7" /> : <BotIcon className="w-7 h-7" />}</span>
                <div className="w-8 h-8 gradient-brand-soft rounded-xl flex items-center justify-center text-[#0d9488] font-bold text-sm mb-3">{item.step}</div>
                <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Problem stat boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto stagger">
            {[
              ["3 na 10", "klientów nie zostawia", "głosówki po godzinach"],
              ["~5600 zł", "kosztuje etat recepcjonisty", "z składkami ZUS"],
              ["<15 min", "średni czas oddzwonienia", "klient już u konkurencji"],
            ].map(([num, title, desc]) => (
              <div key={title} className="card-lift bg-gradient-to-br from-white to-red-50/20 border border-zinc-200 rounded-2xl p-6 text-center hover:border-red-200 hover:shadow-sm transition-all">
                <p className="text-3xl md:text-4xl font-bold text-red-500 mb-2 font-display">{num}</p>
                <p className="text-sm font-semibold text-zinc-900 mb-1">{title}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* === DEMO AUDIO === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Posłuchaj</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Jak brzmi <span className="gradient-text">WitaLine</span>?</h2>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto mb-8">Posłuchaj przykładowej rozmowy z asystentem — naturalny głos, płynna konwersacja, zero robotów.</p>
          <DemoAudioPlayer />
        </div>
      </AnimatedSection>

      {/* === TECHNOLOGIA === */}
      <AnimatedSection id="technologia" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-y border-zinc-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-100/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Technologia</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Najlepsza technologia pod <span className="gradient-text">jednym numerem</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Łączymy najlepsze technologie, aby asystent brzmiał i rozumiał jak człowiek</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12 stagger">
            <div className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200/40">
              <span className="text-[#0d9488] mb-3 block"><MicIcon className="w-7 h-7" /></span>
              <h3 className="font-bold text-zinc-900 mb-3">Synteza mowy nowej generacji</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Ponad 10 000 naturalnie brzmiących głosów",
                  "Latencja odpowiedzi poniżej 100 ms",
                  "Pełny cykl mowa → tekst → analiza → mowa w poniżej 2 sekund",
                  "Automatyczne wykrywanie języka rozmówcy",
                  "Klonowanie głosu z 30 minut nagrania",
                  "Wsparcie 32 języków (polski + angielski natywnie)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200/40">
              <span className="text-[#0d9488] mb-3 block"><BrainIcon className="w-7 h-7" /></span>
              <h3 className="font-bold text-zinc-900 mb-3">Model językowy — inteligencja rozmowy</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Elastyczny wybór modelu konwersacji dopasowany do zadania",
                  "Rozumienie intencji, emocji i kontekstu rozmowy",
                  "Baza wiedzy RAG — bot czyta Twoje dokumenty i cenniki",
                  "Dynamiczne scenariusze — nie sztywne drzewko IVR",
                  "Wykrywanie nastroju klienta (sentiment analysis)",
                  "Płynna eskalacja do konsultanta gdy trzeba",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200/40">
              <span className="text-[#0d9488] mb-3 block"><PhoneIcon className="w-7 h-7" /></span>
              <h3 className="font-bold text-zinc-900 mb-3">Niezawodna infrastruktura telefoniczna</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Globalna sieć telekomunikacyjna (SIP, PSTN)",
                  "Numery stacjonarne i komórkowe (+48)",
                  "Przekierowanie sekwencyjne do konsultantów",
                  "DTMF — klient może wybrać opcję na klawiaturze",
                  "Komunikacja SMS po rozmowie",
                  "Nagrywanie, transkrypcje, webhooki w czasie rzeczywistym",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200/40">
              <span className="text-[#0d9488] mb-3 block"><CloudIcon className="w-7 h-7" /></span>
              <h3 className="font-bold text-zinc-900 mb-3">Bezpieczeństwo i skalowanie</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {[
                  "Serwery w UE (region Frankfurt)",
                  "Pełna zgodność z RODO i polskim prawem",
                  "Szyfrowanie E2E dla nagrań i transkrypcji",
                  "Automatyczne skalowanie — tysiące rozmów równocześnie",
                  "Dashboard z analityką w czasie rzeczywistym",
                  "99.9% SLA dla planu Enterprise",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tech stack visual */}
          <div className="bg-gradient-to-r from-brand-50 to-white border border-brand-100 rounded-2xl p-6 md:p-8 glow-brand">
            <p className="text-sm font-semibold text-zinc-700 mb-4 text-center">Jak przebiega rozmowa — krok po kroku</p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {[
                { icon: <PhoneIcon className="w-4 h-4" />, label: "Klient dzwoni", sub: "PSTN / VoIP" },
                { icon: <MicIcon className="w-4 h-4" />, label: "Zamiana mowy na tekst", sub: "STT w czasie rzeczywistym" },
                { icon: <BrainIcon className="w-4 h-4" />, label: "Analiza konwersacji", sub: "Model językowy + baza wiedzy" },
                { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Synteza mowy", sub: "TTS < 100ms latencji" },
                { icon: <PhoneIcon className="w-4 h-4" />, label: "Klient słyszy", sub: "<2 sekundy" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="bg-white border border-brand-100 rounded-xl px-4 py-2.5 text-center shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-brand-700 whitespace-nowrap flex items-center gap-1.5 justify-center">{step.icon}{step.label}</p>
                    <p className="text-[10px] text-[#0d9488]/70">{step.sub}</p>
                  </div>
                  {i < 4 && <span className="text-brand-200 text-lg hidden sm:inline">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* === KALKULATOR OSZCZEDNOSCI === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Kalkulator</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Ile <span className="gradient-text">oszczędzasz</span>?</h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Porównaj koszt recepcjonisty z automatyczną recepcją WitaLine</p>
          </div>
          <SavingsCalculator />
        </div>
      </AnimatedSection>

      {/* === PRZENOSZENIE NUMERU === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-zinc-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Przenoszenie</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Przenieś swój numer <span className="gradient-text">w 5 dni</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Zachowaj dotychczasowy numer — proces przenoszenia jest prosty i bezstresowy</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 md:gap-6 stagger">
            {[
              { step: "1", title: "Zgłoś chęć", desc: "Wypełnij formularz przeniesienia numeru w panelu administracyjnym. Podaj numer i dane abonenta.", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
              { step: "2", title: "Autoryzacja", desc: "Potwierdź tożsamość u operatora — wyślemy Ci instrukcję wraz z kodem autoryzacyjnym.", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
              { step: "3", title: "Proces u operatora", desc: "Operator rozpoczyna procedurę przeniesienia. Trwa do 5 dni roboczych. My monitorujemy postęp.", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
              { step: "4", title: "Gotowe", desc: "Numer aktywny na WitaLine. Wszystkie rozmowy obsługiwane przez asystenta AI 24/7.", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            ].map((item) => (
              <div key={item.step} className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:border-brand-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 gradient-brand-soft rounded-2xl flex items-center justify-center text-[#0d9488] mx-auto mb-3">{item.icon}</div>
                <div className="w-7 h-7 bg-[#0d9488] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">{item.step}</div>
                <h3 className="font-semibold text-zinc-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 text-center mt-6">Nie masz jeszcze własnego numeru? Otrzymasz nowy numer +48 w pakiecie — aktywacja w 15 minut.</p>
        </div>
      </AnimatedSection>

      {/* === POROWNANIE === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Porównanie</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">WitaLine vs <span className="gradient-text">tradycyjne rozwiązania</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Zobacz jak wypadamy na tle alternatyw</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-200">
                  <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Funkcja</th>
                  <th className="text-center py-3 px-3 bg-[#ccfbf1] text-[#065f46] font-semibold rounded-t-xl">WitaLine</th>
                  <th className="text-center py-3 px-3 text-zinc-500 font-medium">Tradycyjne IVR</th>
                  <th className="text-center py-3 px-3 text-zinc-500 font-medium">Recepcjonista</th>
                  <th className="text-center py-3 pl-3 text-zinc-500 font-medium">CloudTalk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Obsługa 24/7", "Tak", "Tak", "Nie (po godzinach)", "Tylko z agentem AI"],
                  ["Sztuczna inteligencja", "Tak", "Nie (drzewka IVR)", "Nie", "Tak (dodatkowo płatne)"],
                  ["Naturalna rozmowa", "Tak", "Nie (przyciski DTMF)", "Tak", "Nie (scoring, nie rozmowa)"],
                  ["Cena za 1000 min", "1,20 zł/min", "~800-1500 PLN", "~5600 PLN (etat)", "~1200-2000 PLN"],
                  ["Konfiguracja", "15 minut", "2-3 dni", "1 miesiąc (rekrutacja)", "1-2 dni"],
                  ["Integracje", "Google, HubSpot, Pipedrive, Livespace, API", "Brak", "Zależne od osoby", "100+ integracji"],
                  ["Przeniesienie numeru", "Tak (do 5 dni)", "Tak", "Nie dotyczy", "Tak"],
                  ["RODO / UE", "Tak (serwery Frankfurt)", "Zależne", "Tak", "Tak"],
                  ["SMS", "Tak", "Nie", "Nie", "Tak (dodatkowo)"],
                  ["Własny prompt AI", "Tak", "Nie", "Nie", "Nie"],
                ].map(([feature, witaline, ivr, rec, ct]) => (
                  <tr key={feature} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition">
                    <td className="py-2.5 pr-4 text-zinc-700 font-medium">{feature}</td>
                    <td className="text-center py-2.5 px-3 text-[#0d9488] font-semibold">{witaline}</td>
                    <td className="text-center py-2.5 px-3 text-zinc-500">{ivr}</td>
                    <td className="text-center py-2.5 px-3 text-zinc-500">{rec}</td>
                    <td className="text-center py-2.5 pl-3 text-zinc-500">{ct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-400 text-center mt-4">Ceny orientacyjne, mogą się różnić w zależności od dostawcy i konfiguracji.</p>
        </div>
      </AnimatedSection>

      {/* === CASE STUDIES === */}
      <AnimatedSection id="case-studies" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-50/30 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Wdrożenia</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Sprawdzone <span className="gradient-text">w biznesie</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Realne przypadki, konkretne liczby — jak WitaLine zmienia obsługę klienta</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger">
            {caseStudies.map((cs) => (
              <div key={cs.title} className="card-lift bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all group">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#0d9488]">{cs.icon === "building" ? <BuildingIcon className="w-6 h-6" /> : cs.icon === "phone" ? <PhoneIcon className="w-6 h-6" /> : <BankIcon className="w-6 h-6" />}</span>
                    <div>
                      <h3 className="font-bold text-zinc-900">{cs.title}</h3>
                      <p className="text-xs text-zinc-400">{cs.domain}</p>
                    </div>
                  </div>
                  <details className="group/cs">
                    <summary className="text-sm text-zinc-500 leading-relaxed cursor-pointer list-none marker:content-none">
                      <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-1">Wyzwanie</span>
                      {cs.challenge}
                    </summary>
                    <div className="mt-3 space-y-3 pt-3 border-t border-zinc-100">
                      <div>
                        <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block mb-1">Rozwiązanie</span>
                        <p className="text-sm text-zinc-500">{cs.solution}</p>
                      </div>
                      <div>
                        <span className="text-green-600 text-xs font-semibold uppercase tracking-wider block mb-1">Efekty</span>
                        <ul className="space-y-1">
                          {cs.results.map((r) => (
                            <li key={r} className="text-sm text-green-700 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">✓</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-zinc-400">
              Chcesz poznać case study dla swojej branży?{" "}
              <a href="#kontakt" className="text-[#0d9488] hover:text-[#0d9488] font-medium">Skontaktuj się z nami</a>
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* === CO ZYSKUJESZ === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-100/20 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-zinc-900 mb-4 font-display tracking-tight">{tr.benefits.title}</h2>
          <p className="text-center text-zinc-500 mb-12 md:mb-16 max-w-2xl mx-auto">{tr.benefits.subtitle}</p>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-6 stagger">
            {tr.benefits.items.map(([title, desc]) => (
              <div key={title} className="card-lift bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 flex gap-4 items-start hover:border-brand-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 gradient-brand-soft rounded-xl flex items-center justify-center shrink-0"><CheckIcon /></div>
                <div><h3 className="font-semibold text-zinc-900 mb-1 text-sm md:text-base">{title}</h3><p className="text-sm text-zinc-500 leading-relaxed">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* === BEZPIECZEŃSTWO I RODO === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-50/30 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Bezpieczeństwo</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Twoje dane są <span className="gradient-text">bezpieczne</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">Pełna zgodność z RODO, europejskie serwery i szyfrowanie na każdym etapie</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger">
            {[
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Serwery w UE", desc: "Wszystkie dane przechowywane w regionie Frankfurt (Google Cloud). Żadnych danych poza Europą." },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 1010 10V4h-8.5"/></svg>, title: "Zgodność z RODO", desc: "Pełna zgodność z europejskim rozporządzeniem o ochronie danych. Umowa powierzenia dla klientów Enterprise." },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, title: "Szyfrowanie E2E", desc: "Nagrania i transkrypcje szyfrowane端到端. Klucze szyfrowania rotowane regularnie." },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><circle cx="12" cy="12" r="3"/></svg>, title: "Regularne audyty", desc: "Niezależne audyty bezpieczeństwa co kwartał. Raporty dostępne dla klientów Enterprise na żądanie." },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: "Backup i DR", desc: "Automatyczne kopie zapasowe co 6 godzin. Plan disaster recovery z RTO poniżej 15 minut." },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, title: "Kontrola dostępu", desc: "Dostęp na zasadzie least privilege. Logowanie dwuskładnikowe (2FA) dla wszystkich kont administracyjnych." },
            ].map((item) => (
              <div key={item.title} className="card-lift bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 hover:border-brand-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 gradient-brand-soft rounded-2xl flex items-center justify-center text-[#0d9488] mb-4">{item.icon}</div>
                <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* === INTEGRACJE === */}
      <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-100 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-brand-100/20 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Integracje</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 mb-4 font-display tracking-tight">Łączy się z Twoimi <span className="gradient-text">narzędziami</span></h2>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">WitaLine integruje się z popularnymi CRM, kalendarzami i systemami, których używasz na co dzień</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 stagger">
            {[
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: "Google Calendar", desc: "Sprawdzaj dostępność i twórz wydarzenia bezpośrednio z rozmowy" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, title: "HubSpot", desc: "Zapisuj kontakty, loguj rozmowy i aktualizuj deal w czasie rzeczywistym" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, title: "Pipedrive", desc: "Twórz deal, dodawaj notatki i aktualizuj etapy sprzedaży głosem" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>, title: "Livespace", desc: "Synchronizuj rozmowy z systemem CRM — kontakty, deal i aktywności" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, title: "Slack", desc: "Powiadomienia o nowych leadach i połączeniach w czasie rzeczywistym" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, title: "API & Webhooki", desc: "Własne integracje przez REST API i webhooki zdarzeń w czasie rzeczywistym" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: "Zapier / Make", desc: "Konfiguruj automatyzacje bez kodowania — setki gotowych integracji" },
              { icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: "Własny CRM", desc: "Integracja z dowolnym CRM przez API — dedykowane wdrożenie dla Enterprise" },
            ].map((item) => (
              <div key={item.title} className="card-lift bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 text-center hover:border-brand-200 hover:shadow-md transition-all">
                <div className="w-14 h-14 gradient-brand-soft rounded-2xl flex items-center justify-center text-[#0d9488] mx-auto mb-3">{item.icon}</div>
                <h3 className="font-semibold text-zinc-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* === STATYSTYKI / SOCIAL PROOF === */}
      <AnimatedSection className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0c1929] via-[#0f1f33] to-[#14283e] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d9488]/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "200+", label: "aktywnych firm", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
              { value: "15 000+", label: "rozmów miesięcznie", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> },
              { value: "5.0", label: "średnia ocen", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
              { value: "99.9%", label: "dostępności SLA", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-14 h-14 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-center text-white/40 mx-auto mb-3">{stat.icon}</div>
                <p className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight">{stat.value}</p>
                <p className="text-sm text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </AnimatedSection>

      {/* === CTA PHONE === */}
      <AnimatedSection className="bg-gradient-to-r from-[#0c1929] via-[#0f1f33] to-[#14283e] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d9488]/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center relative">
          <p className="text-sm text-white/60 font-medium mb-4">Zadzwoń i sprawdź &mdash; asystent odbiera 24/7</p>
          <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="inline-flex items-center gap-4 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-[#0d9488]/30 rounded-2xl px-8 py-4 transition-all group">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse-soft" />
            <span className="text-2xl md:text-3xl font-bold text-white tracking-wide font-mono group-hover:text-white/80 transition-colors">{WITALINE_PHONE_DISPLAY}</span>
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
          <p className="text-xs text-white/30 mt-4">Odbierzemy od razu lub oddzwonimy w 15 minut &middot; 7 dni w tygodniu</p>
        </div>
      </AnimatedSection>

      {/* === CENNIK === */}
      <AnimatedSection id="cennik">
        <PricingSection tr={tr.pricing} locale={localeState} />
      </AnimatedSection>

      {/* === BLOG === */}
      <AnimatedSection id="blog" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-zinc-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/30 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#ccfbf1] text-[#065f46] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">Blog</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight">Wiedza o <span className="gradient-text">automatycznej recepcji</span></h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">Technologia, case studies, analizy i porady — wszystko o automatyzacji obsługi telefonicznej</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger">
            {blogPosts.map((post) => (
              <a key={post.title} href={post.href} className="card-lift group bg-white border border-zinc-200 rounded-2xl p-6 hover:border-brand-200 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 uppercase tracking-wider mb-3">
                  <span className="bg-brand-50 px-2 py-1 rounded-md">{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2 group-hover:text-[#0d9488] transition-colors text-sm leading-snug">{post.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{post.desc}</p>
                <span className="inline-block mt-4 text-xs font-medium text-[#0d9488] group-hover:text-[#0d9488] transition-colors">Czytaj więcej →</span>
              </a>
            ))}
          </div>
          <div className="text-center mt-8">
            <div className="text-center mt-8">
              <a href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-[#0d9488] hover:text-[#0d9488] transition">
                Zobacz wszystkie artykuły
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* === FAQ === */}
      <AnimatedSection id="faq" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-100 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-50/40 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0d9488] bg-brand-100 px-3 py-1 rounded-full mb-3">{tr.faq.overline}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 font-display tracking-tight">{tr.faq.title}</h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">Wszystko co musisz wiedzieć zanim zaczniesz</p>
          </div>
          <FaqSection faqItems={faqItems} locale={localeState} />
        </div>
      </AnimatedSection>

      {/* === KONTAKT / CTA === */}
      <AnimatedSection id="kontakt" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0c1929] via-[#0f1f33] to-[#14283e] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d9488]/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0d9488]/5 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight">{tr.contact.title}</h2>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">{tr.contact.subtitle}</p>
              <div className="space-y-4">
                {[{ icon: <PhoneIcon className="w-5 h-5" />, text: tr.contact.phone, desc: tr.contact.phoneDesc }, { icon: <EnvelopeIcon className="w-5 h-5" />, text: tr.contact.email, desc: tr.contact.emailDesc }, { icon: <PinIcon className="w-5 h-5" />, text: tr.contact.location, desc: tr.contact.locationDesc }].map(({ icon, text, desc }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-white/60 shrink-0">{icon}</span>
                    <div><p className="text-sm font-medium text-white">{text}</p><p className="text-xs text-white/40">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 md:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <FloatingWidget />
    </div>
  );
}
