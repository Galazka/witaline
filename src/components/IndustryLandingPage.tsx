import Link from "next/link";
import { WITALINE_PHONE_DISPLAY, WITALINE_PHONE_NUMBER } from "@/lib/constants";

interface IndustryConfig {
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  features: { icon: string; title: string; desc: string }[];
  cta: string;
}

const industries: Record<string, IndustryConfig> = {
  restauracja: {
    slug: "restauracja",
    name: "Gastronomia",
    title: "Automatyczna recepcja AI dla restauracji",
    subtitle: "Odbieraj zamówienia i rezerwacje 24/7 bez angażowania personelu",
    description: "Nie trać klientów, którzy dzwonią w godzinach szczytu. Asystent AI WitaLine odbiera każde połączenie, przyjmuje zamówienia na wynos, rezerwacje stolików i odpowiada na pytania o menu. W pełni po polsku, naturalnym głosem.",
    benefits: [
      "Przyjmowanie zamówień na wynos i rezerwacji 24/7",
      "Odpowiadanie na pytania o menu, alergeny, godziny otwarcia",
      "Integracja z kalendarzem Google — automatyczne terminy",
      "Przełączanie na konsultanta w trudnych sytuacjach",
      "100% połączeń odebranych — zero straconych klientów",
    ],
    features: [
      { icon: "🍽️", title: "Zamówienia telefoniczne", desc: "Asystent przyjmuje zamówienia na wynos i rezerwacje stolików bez angażowania obsługi." },
      { icon: "📅", title: "Rezerwacje online", desc: "Automatyczne umawianie terminów z integracją z kalendarzem Google." },
      { icon: "📊", title: "Raporty i statystyki", desc: "Pełna historia połączeń, zamówień i leadów w panelu zarządzania." },
      { icon: "🔄", title: "Transfer do człowieka", desc: "Gdy asystent nie poradzi sobie z pytaniem, przełącza rozmowę na konsultanta." },
    ],
    cta: "Sprawdź WitaLine dla restauracji",
  },
  beauty: {
    slug: "beauty",
    name: "Salon beauty / Fryzjer",
    title: "Automatyczna recepcja AI dla salonów beauty",
    subtitle: "Umawiaj wizyty i odpowiadaj na pytania 24/7",
    description: "Klienci dzwonią o różnych porach — nie każdy może odebrać. Asystent AI WitaLine umawia wizyty na strzyżenie, koloryzację, manicure i inne usługi bez angażowania personelu.",
    benefits: [
      "Rezerwacja wizyt online przez telefon 24/7",
      "Automatyczne potwierdzenia i przypomnienia SMS",
      "Zarządzanie grafikiem z poziomu panelu",
      "Baza wiedzy o usługach i cenach",
      "Integracja z Google Calendar",
    ],
    features: [
      { icon: "💇", title: "Rezerwacja online", desc: "Klienci umawiają wizyty przez telefon bez angażowania recepcji." },
      { icon: "📋", title: "Panel zarządzania", desc: "Pełna kontrola nad grafikiem, usługami i cenami." },
      { icon: "📱", title: "Przypomnienia SMS", desc: "Automatyczne SMS-y przypominające o wizytach zmniejszają liczbę nieodwołanych." },
      { icon: "📈", title: "Statystyki", desc: "Śledź liczbę rezerwacji, leadów i kosztów w czasie rzeczywistym." },
    ],
    cta: "Sprawdź WitaLine dla salonów beauty",
  },
  medycyna: {
    slug: "medycyna",
    name: "Medycyna / Stomatolog",
    title: "Automatyczna recepcja AI dla gabinetów medycznych",
    subtitle: "Umawiaj wizyty pacjentów i odpowiadaj na pytania 24/7",
    description: "Pacjenci dzwonią o różnych porach — nie każdy może odebrać. Asystent AI WitaLine umawia wizyty, odpowiada na pytania o godziny przyjęć i przyjmuje zgłoszenia. Profesjonalnie, z empatią, po polsku.",
    benefits: [
      "Rejestracja pacjentów 24/7 przez telefon",
      "Umawianie, odwoływanie i zmiana terminów",
      "Odpowiadanie na pytania o ceny i przygotowanie do zabiegów",
      "Kierowanie pilnych zgłoszeń do personelu",
      "Integracja z kalendarzem Google",
    ],
    features: [
      { icon: "🩺", title: "Rejestracja pacjentów", desc: "Asystent umawia wizyty kontrolne, konsultacje i zabiegi bez angażowania recepcji." },
      { icon: "📅", title: "Zarządzanie terminami", desc: "Pełna kontrola nad grafikiem, zmiana i odwoływanie wizyt." },
      { icon: "💊", title: "Obsługa zapytań", desc: "Odpowiadanie na pytania o ceny, godziny przyjęć, przygotowanie do zabiegów." },
      { icon: "🚑", title: "Priorytetyzacja", desc: "Pilne zgłoszenia są automatycznie kierowane do personelu medycznego." },
    ],
    cta: "Sprawdź WitaLine dla medycyny",
  },
  prawo: {
    slug: "prawo",
    name: "Kancelaria prawna",
    title: "Automatyczna recepcja AI dla kancelarii prawnych",
    subtitle: "Umawiaj konsultacje i zbieraj leady 24/7",
    description: "Klienci szukają pomocy prawnej o różnych porach. Asystent AI WitaLine odbiera połączenia, umawia konsultacje i zbiera informacje o sprawie. Z pełną dyskrecją i profesjonalizmem.",
    benefits: [
      "Umawianie konsultacji prawnych 24/7",
      "Zbieranie opisu sprawy i danych kontaktowych",
      "Przekierowanie do odpowiedniego prawnika",
      "Pełna dyskrecja i zgodność z RODO",
      "Integracja z kalendarzem i CRM",
    ],
    features: [
      { icon: "⚖️", title: "Konsultacje prawne", desc: "Asystent umawia spotkania i zbiera podstawowe informacje o sprawie." },
      { icon: "🔒", title: "Dyskrecja", desc: "Pełna zgodność z RODO, dane przechowywane na serwerach w Europie." },
      { icon: "📋", title: "Zbieranie leadów", desc: "Automatyczne zapisywanie danych klientów i opisu sprawy w panelu." },
      { icon: "🔄", title: "Eskalacja", desc: "Trudne sprawy są automatycznie przekazywane do odpowiedniego prawnika." },
    ],
    cta: "Sprawdź WitaLine dla kancelarii",
  },
  hotel: {
    slug: "hotel",
    name: "Hotel / Turystyka",
    title: "Automatyczna recepcja AI dla hoteli",
    subtitle: "Rezerwuj pokoje i odpowiadaj na pytania gości 24/7",
    description: "Goście dzwonią o różnych porach z pytaniami o dostępność, ceny i rezerwacje. Asystent AI WitaLine odbiera każde połączenie i profesjonalnie obsługuje gości w języku polskim i angielskim.",
    benefits: [
      "Rezerwacja pokoi 24/7 przez telefon",
      "Odpowiadanie na pytania o ceny, wyżywienie, udogodnienia",
      "Dwujęzyczna obsługa (PL/EN)",
      "Integracja z systemem rezerwacyjnym",
      "Statystyki i raporty w panelu",
    ],
    features: [
      { icon: "🏨", title: "Rezerwacje", desc: "Asystent przyjmuje rezerwacje pokoi, sprawdza dostępność i potwierdza terminy." },
      { icon: "🌐", title: "Dwujęzyczność", desc: "Automatyczne wykrywanie języka — obsługa po polsku i angielsku." },
      { icon: "📊", title: "Raporty", desc: "Pełna historia rezerwacji, leadów i kosztów w panelu." },
      { icon: "👥", title: "Transfer do recepcji", desc: "W razie potrzeby asystent przełącza rozmowę na recepcjonistę." },
    ],
    cta: "Sprawdź WitaLine dla hoteli",
  },
};

export function getIndustryConfig(slug: string): IndustryConfig | undefined {
  return industries[slug];
}

export function getAllIndustrySlugs(): string[] {
  return Object.keys(industries);
}

export function getAllIndustryConfigs(): IndustryConfig[] {
  return Object.values(industries);
}

export default function IndustryLandingPage({ industry }: { industry: IndustryConfig }) {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#3CBF4A]">WitaLine</Link>
          <div className="flex items-center gap-4">
            <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="text-sm text-zinc-600 hover:text-zinc-900 hidden sm:block">{WITALINE_PHONE_DISPLAY}</a>
            <Link href="/register" className="bg-[#3CBF4A] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#34a840] transition-colors">
              Wypróbuj za darmo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 leading-tight mb-6">
            {industry.title}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto mb-4">
            {industry.subtitle}
          </p>
          <p className="text-base text-zinc-500 max-w-3xl mx-auto mb-8 leading-relaxed">
            {industry.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-[#3CBF4A] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#34a840] transition-all shadow-lg shadow-green-200"
            >
              {industry.cta}
            </Link>
            <a
              href={`tel:${WITALINE_PHONE_NUMBER}`}
              className="text-zinc-600 hover:text-zinc-900 text-base flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {WITALINE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">Co zyskujesz z WitaLine?</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {industry.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                <svg className="w-5 h-5 text-[#3CBF4A] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-zinc-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-4">Jak działa WitaLine?</h2>
          <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Asystent AI odbiera telefony, obsługuje klientów i zapisuje wyniki w panelu.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industry.features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-zinc-100 hover:border-green-200 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Gotowy na automatyzację?</h2>
          <p className="text-green-100 text-lg mb-8">Wypróbuj WitaLine za darmo przez 7 dni. 15 minut darmowych rozmów i 10 SMS-ów.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-green-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-50 transition-all"
            >
              Zacznij za darmo
            </Link>
            <a
              href={`tel:${WITALINE_PHONE_NUMBER}`}
              className="text-white/90 hover:text-white text-base"
            >
              {WITALINE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">WitaLine — Automatyczna Recepcja AI</p>
          <p>© {new Date().getFullYear()} WitaLine. Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </main>
  );
}
