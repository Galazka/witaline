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
  fitness: {
    slug: "fitness",
    name: "Fitness / Klub sportowy",
    title: "Automatyczna recepcja AI dla klubów fitness",
    subtitle: "Zapisy na zajęcia i informacje o karnetach 24/7",
    description: "Członkowie klubu dzwonią o różnych porach z pytaniami o grafik, karnety i zapisy. Asystent AI WitaLine odbiera każde połączenie, zapisuje na zajęcia grupowe i treningi personalne, odpowiada na pytania o ofertę.",
    benefits: ["Zapisy na zajęcia grupowe i treningi 24/7", "Informowanie o grafiku, karnetach i promocjach", "Automatyczne przypomnienia SMS o zajęciach", "Integracja z kalendarzem Google", "Statystyki frekwencji w panelu"],
    features: [{ icon: "💪", title: "Zapisy na zajęcia", desc: "Asystent zapisuje członków na zajęcia grupowe i treningi personalne bez angażowania recepcji." }, { icon: "📅", title: "Grafik zajęć", desc: "Automatyczne informowanie o harmonogramie i dostępności instruktorów." }, { icon: "📱", title: "Przypomnienia SMS", desc: "Automatyczne SMS-y przypominające o zajęciach zmniejszają liczbę nieobecności." }, { icon: "📊", title: "Raporty", desc: "Śledź frekwencję, zapisy i koszty w czasie rzeczywistym." }],
    cta: "Sprawdź WitaLine dla fitness",
  },
  motoryzacja: {
    slug: "motoryzacja",
    name: "Motoryzacja / Warsztat",
    title: "Automatyczna recepcja AI dla warsztatów",
    subtitle: "Umawiaj wizyty i przyjmuj zgłoszenia 24/7",
    description: "Klienci dzwonią z awariami i pytaniami o termin. Asystent AI WitaLine odbiera każde połączenie, umawia wizyty na przeglądy i naprawy, informuje o cenniku i przyjmuje zgłoszenia awaryjne.",
    benefits: ["Umawianie wizyt na przeglądy i naprawy 24/7", "Przyjmowanie zgłoszeń awaryjnych", "Informowanie o cenniku i zakresie usług", "Automatyczne potwierdzenia SMS", "Integracja z kalendarzem Google"],
    features: [{ icon: "🔧", title: "Rezerwacja wizyt", desc: "Asystent umawia terminy na przeglądy, naprawy i wymianę opon." }, { icon: "🚨", title: "Awaryjne zgłoszenia", desc: "Pilne awarie są priorytetyzowane i kierowane do mechanika." }, { icon: "💰", title: "Informacje o cenach", desc: "Asystent podaje wstępne wyceny i informuje o cenniku usług." }, { icon: "📋", title: "Panel zarządzania", desc: "Pełna kontrola nad grafikiem, usługami i historią klientów." }],
    cta: "Sprawdź WitaLine dla warsztatów",
  },
  nieruchomosci: {
    slug: "nieruchomosci",
    name: "Nieruchomości",
    title: "Automatyczna recepcja AI dla biur nieruchomości",
    subtitle: "Umawiaj oględziny i zbieraj leady 24/7",
    description: "Klienci dzwonią o różnych porach z pytaniami o oferty. Asystent AI WitaLine odbiera każde połączenie, umawia oględziny nieruchomości, zbiera preferencje klientów i przekazuje leady do agentów.",
    benefits: ["Umawianie oględzin nieruchomości 24/7", "Zbieranie preferencji klientów i budżetu", "Automatyczne leady do systemu CRM", "Przekierowanie do agenta przy poważnych zapytaniach", "Integracja z kalendarzem"],
    features: [{ icon: "🏠", title: "Oględziny nieruchomości", desc: "Asystent umawia spotkania i zbiera preferencje klientów." }, { icon: "📋", title: "Zbieranie leadów", desc: "Automatyczne zapisywanie danych kontaktowych i preferencji w panelu." }, { icon: "🔄", title: "Eskalacja do agenta", desc: "Poważne zapytania są przekazywane do agenta nieruchomości." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę leadów, oględzin i konwersji." }],
    cta: "Sprawdź WitaLine dla nieruchomości",
  },
  edukacja: {
    slug: "edukacja",
    name: "Edukacja / Korepetycje",
    title: "Automatyczna recepcja AI dla szkół i korepetytorów",
    subtitle: "Zapisuj na lekcje i odpowiadaj na pytania 24/7",
    description: "Rodzice i uczniowie dzwonią z pytaniami o zajęcia. Asystent AI WitaLine umawia lekcje indywidualne i grupowe, informuje o cenniku i dostępności, przyjmuje zapisy na kursy.",
    benefits: ["Zapisy na lekcje i kursy 24/7", "Informowanie o cenniku i terminach", "Obsługa rodziców pytających o dzieci", "Automatyczne przypomnienia SMS", "Integracja z kalendarzem"],
    features: [{ icon: "📚", title: "Zapisy na zajęcia", desc: "Asystent umawia lekcje indywidualne, grupowe i konsultacje online." }, { icon: "👨‍👩‍👧", title: "Obsługa rodziców", desc: "Cierpliwa i przyjazna obsługa rodziców zapisujących dzieci na zajęcia." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y przypominające o lekcjach." }, { icon: "💻", title: "Online i stacjonarnie", desc: "Obsługa zajęć zarówno stacjonarnych jak i online." }],
    cta: "Sprawdź WitaLine dla edukacji",
  },
  turystyka: {
    slug: "turystyka",
    name: "Turystyka / Podróże",
    title: "Automatyczna recepcja AI dla biur podróży",
    subtitle: "Rezerwuj wycieczki i odpowiadaj na pytania 24/7",
    description: "Klienci dzwonią z pytaniami o oferty wakacyjne i rezerwacje. Asystent AI WitaLine odbiera każde połączenie, pomaga w wyborze wycieczek, przyjmuje rezerwacje i informuje o promocjach.",
    benefits: ["Rezerwacja wycieczek i wakacji 24/7", "Informowanie o ofertach i promocjach", "Dwujęzyczna obsługa PL/EN", "Automatyczne potwierdzenia SMS", "Baza wiedzy o destynacjach"],
    features: [{ icon: "✈️", title: "Rezerwacje", desc: "Asystent przyjmuje rezerwacje wycieczek i pomaga w wyborze destynacji." }, { icon: "🌐", title: "Dwujęzyczność", desc: "Automatyczne wykrywanie języka — obsługa po polsku i angielsku." }, { icon: "💰", title: "Promocje", desc: "Informowanie o aktualnych ofertach i promocjach last minute." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę rezerwacji i zapytań w panelu." }],
    cta: "Sprawdź WitaLine dla turystyki",
  },
  it: {
    slug: "it",
    name: "IT / Technologia",
    title: "Automatyczna recepcja AI dla firm IT",
    subtitle: "Przyjmuj zgłoszenia i umawiaj konsultacje 24/7",
    description: "Klienci dzwonią z problemami technicznym i pytaniami o usługi. Asystent AI WitaLine odbiera każde połączenie, przyjmuje zgłoszenia serwisowe, umawia konsultacje techniczne i odpowiada na pytania o ofertę.",
    benefits: ["Przyjmowanie zgłoszeń serwisowych 24/7", "Umawianie konsultacji technicznych", "Kategoryzacja pilności zgłoszenia", "Eskalacja do specjalistów", "Integracja z systemem helpdesk"],
    features: [{ icon: "💻", title: "Helpdesk", desc: "Asystent przyjmuje zgłoszenia techniczne i kategoryzuje je według pilności." }, { icon: "🔧", title: "Diagnostyka", desc: "Zbieranie informacji o problemie przed przekazaniem do specjalisty." }, { icon: "📅", title: "Konsultacje", desc: "Umawianie terminów konsultacji technicznych i wdrożeń." }, { icon: "🔄", title: "Eskalacja", desc: "Pilne zgłoszenia są automatycznie kierowane do odpowiedniego specjalisty." }],
    cta: "Sprawdź WitaLine dla IT",
  },
  weterynarz: {
    slug: "weterynarz",
    name: "Weterynaria",
    title: "Automatyczna recepcja AI dla gabinetów weterynaryjnych",
    subtitle: "Umawiaj wizyty dla zwierząt 24/7",
    description: "Właściciele zwierząt dzwonią z troską o swoich pupili. Asystent AI WitaLine umawia wizyty, przyjmuje zgłoszenia pilne i informuje o godzinach otwarcia. Z empatią i profesjonalizmem.",
    benefits: ["Umawianie wizyt dla zwierząt 24/7", "Przyjmowanie zgłoszeń pilnych", "Informowanie o szczepieniach i profilaktyce", "Przypominanie o terminach wizyt SMS", "Integracja z kalendarzem"],
    features: [{ icon: "🐾", title: "Wizyty dla zwierząt", desc: "Asystent umawia wizyty kontrolne, szczepienia i zabiegi." }, { icon: "🚑", title: "Zgłoszenia pilne", desc: "Nagłe przypadki są kierowane natychmiast do lekarza weterynarii." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y o terminach szczepień i odrobaczania." }, { icon: "❤️", title: "Empatia", desc: "Asystent wykazuje troskę o zwierzę i właściciela." }],
    cta: "Sprawdź WitaLine dla weterynarii",
  },
  "sklep-internetowy": {
    slug: "sklep-internetowy",
    name: "Sklep internetowy",
    title: "Automatyczna recepcja AI dla e-commerce",
    subtitle: "Przyjmuj zamówienia telefoniczne 24/7",
    description: "Klienci dzwonią z pytaniami o produkty i zamówienia. Asystent AI WitaLine przyjmuje zamówienia telefoniczne, informuje o statusie przesyłek, odpowiada na pytania o dostępność i przyjmuje reklamacje.",
    benefits: ["Przyjmowanie zamówień telefonicznych 24/7", "Sprawdzanie statusu przesyłek", "Informowanie o dostępności i promocjach", "Obsługa reklamacji i zwrotów", "Integracja z systemem zamówień"],
    features: [{ icon: "🛒", title: "Zamówienia telefoniczne", desc: "Asystent przyjmuje zamówienia przez telefon dla klientów niekorzystających z internetu." }, { icon: "📦", title: "Status przesyłek", desc: "Sprawdzanie i informowanie o statusie zamówień." }, { icon: "💬", title: "Reklamacje", desc: "Przyjmowanie zgłoszeń reklamacyjnych i kierowanie do działu obsługi." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę zamówień telefonicznych i zapytań." }],
    cta: "Sprawdź WitaLine dla e-commerce",
  },
  transport: {
    slug: "transport",
    name: "Transport / Kurier",
    title: "Automatyczna recepcja AI dla firm transportowych",
    subtitle: "Przyjmuj zlecenia i sprawdzaj status 24/7",
    description: "Klienci dzwonią z pytaniami o transport i status przesyłek. Asystent AI WitaLine przyjmuje zlecenia transportowe, podaje wstępne wyceny, informuje o statusie i umawia odbiory.",
    benefits: ["Przyjmowanie zleceń transportowych 24/7", "Sprawdzanie statusu przesyłek", "Wstępne wyceny transportu", "Umawianie odbiorów i dostaw", "Integracja z systemem logistycznym"],
    features: [{ icon: "🚛", title: "Zlecenia transportu", desc: "Asystent przyjmuje zlecenia i zbiera informacje o ładunku i trasie." }, { icon: "📍", title: "Śledzenie przesyłek", desc: "Informowanie klientów o aktualnym statusie przesyłek." }, { icon: "💰", title: "Wyceny", desc: "Podawanie wstępnych wycen transportu." }, { icon: "📅", title: "Harmonogram", desc: "Umawianie terminów odbioru i dostawy." }],
    cta: "Sprawdź WitaLine dla transportu",
  },
  fotografia: {
    slug: "fotografia",
    name: "Fotografia / Film",
    title: "Automatyczna recepcja AI dla fotografów",
    subtitle: "Umawiaj sesje i przyjmuj zlecenia 24/7",
    description: "Klienci dzwonią z pytaniami o sesje i terminy. Asystent AI WitaLine umawia sesje fotograficzne i filmowe, informuje o portfolio i cenniku, przyjmuje zlecenia na filmy ślubne i korporacyjne.",
    benefits: ["Umawianie sesji fotograficznych 24/7", "Przyjmowanie zleceń na filmy", "Informowanie o portfolio i cenniku", "Automatyczne potwierdzenia SMS", "Integracja z kalendarzem"],
    features: [{ icon: "📸", title: "Sesje fotograficzne", desc: "Asystent umawia sesje ślubne, portretowe i produktowe." }, { icon: "🎬", title: "Zlecenia filmowe", desc: "Przyjmowanie zleceń na filmy ślubne, korporacyjne i reklamowe." }, { icon: "📋", title: "Zbieranie briefu", desc: "Asystent zbiera informacje o oczekiwaniach klienta przed sesją." }, { icon: "📅", title: "Terminarz", desc: "Pełna kontrola nad grafikiem sesji i terminów." }],
    cta: "Sprawdź WitaLine dla fotografii",
  },
  stomatolog: {
    slug: "stomatolog",
    name: "Stomatologia",
    title: "Automatyczna recepcja AI dla gabinetów stomatologicznych",
    subtitle: "Umawiaj wizyty i uspokajaj pacjentów 24/7",
    description: "Pacjenci dzwonią z bólem zęba i pytaniami o zabiegi. Asystent AI WitaLine umawia wizyty, przyjmuje zgłoszenia pilne i informuje o zakresie usług. Z uspokajającym, profesjonalnym tonem.",
    benefits: ["Rejestracja pacjentów 24/7 przez telefon", "Przyjmowanie zgłoszeń pilnych (ból zęba)", "Informowanie o zabiegach i cenniku", "Przypominanie o wizytach kontrolnych SMS", "Integracja z kalendarzem"],
    features: [{ icon: "🦷", title: "Rejestracja pacjentów", desc: "Asystent umawia wizyty kontrolne, scaling, leczenie kanałowe i implanty." }, { icon: "🚨", title: "Przyjęcia pilne", desc: "Pilne zgłoszenia (ból, złamanie) są priorytetyzowane." }, { icon: "😌", title: "Empatia", desc: "Wielu pacjentów się boi — asystent jest uspokajający i ciepły." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y przypominające o wizytach." }],
    cta: "Sprawdź WitaLine dla stomatologii",
  },
  fizjoterapia: {
    slug: "fizjoterapia",
    name: "Fizjoterapia / Rehabilitacja",
    title: "Automatyczna recepcja AI dla fizjoterapii",
    subtitle: "Umawiaj wizyty rehabilitacyjne 24/7",
    description: "Pacjenci dzwonią z bólami i urazami. Asystent AI WitaLine umawia wizyty fizjoterapeutyczne, przyjmuje zgłoszenia pourazowe i informuje o zakresie usług rehabilitacyjnych.",
    benefits: ["Umawianie wizyt rehabilitacyjnych 24/7", "Przyjmowanie zgłoszeń pourazowych", "Informowanie o zaleceniach i przebiegu leczenia", "Automatyczne przypomnienia SMS", "Integracja z kalendarzem"],
    features: [{ icon: "🩺", title: "Wizyty rehabilitacyjne", desc: "Asystent umawia wizyty na fizjoterapię, masaże i rehabilitację." }, { icon: "💪", title: "Zgłoszenia pourazowe", desc: "Pilne przypadki urazów są priorytetyzowane." }, { icon: "📋", title: "Plan leczenia", desc: "Informowanie o przebiegu rehabilitacji i zaleceniach." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y o terminach wizyt." }],
    cta: "Sprawdź WitaLine dla fizjoterapii",
  },
  kwiaciarnia: {
    slug: "kwiaciarnia",
    name: "Kwiaciarnia",
    title: "Automatyczna recepcja AI dla kwiaciarni",
    subtitle: "Przyjmuj zamówienia kwiatów 24/7",
    description: "Klienci dzwonią z zamówieniami kwiatów na różne okazje. Asystent AI WitaLine przyjmuje zamówienia na bukiety, doradza w wyborze kwiatów i umawia dostawy.",
    benefits: ["Przyjmowanie zamówień kwiatów 24/7", "Doradzanie w wyborze na okazję", "Umawianie terminów dostawy", "Obsługa zamówień pogrzebowych", "Automatyczne potwierdzenia SMS"],
    features: [{ icon: "💐", title: "Zamówienia kwiatów", desc: "Asystent przyjmuje zamówienia na bukiety okolicznościowe i ślubne." }, { icon: "🎯", title: "Doradztwo", desc: "Pomoc w wyborze odpowiednich kwiatów na konkretną okazję." }, { icon: "🚚", title: "Dostawa", desc: "Umawianie terminów i adresów dostawy." }, { icon: "📱", title: "Potwierdzenia", desc: "Automatyczne SMS-y z potwierdzeniem zamówienia." }],
    cta: "Sprawdź WitaLine dla kwiaciarni",
  },
  budownictwo: {
    slug: "budownictwo",
    name: "Budownictwo / Remonty",
    title: "Automatyczna recepcja AI dla firm budowlanych",
    subtitle: "Przyjmuj zapytania o wyceny 24/7",
    description: "Klienci dzwonią z pytaniami o remonty i budowę. Asystent AI WitaLine przyjmuje zapytania o wyceny, umawia spotkania z kierownikiem budowy i informuje o zakresie usług.",
    benefits: ["Przyjmowanie zapytań o wyceny 24/7", "Umawianie spotkań z kierownikiem", "Informowanie o zakresie usług", "Sprawdzanie dostępności ekipy", "Automatyczne leady do CRM"],
    features: [{ icon: "🔨", title: "Zapytania o wyceny", desc: "Asystent zbiera informacje o remoncie i przygotowuje do wyceny." }, { icon: "📅", title: "Spotkania", desc: "Umawianie terminów wizyt kierownika budowy." }, { icon: "📋", title: "Zakres usług", desc: "Informowanie o wszystkich usługach budowlanych." }, { icon: "👷", title: "Dostępność ekipy", desc: "Sprawdzanie terminów i dostępności ekip remontowych." }],
    cta: "Sprawdź WitaLine dla budownictwa",
  },
  sprzatanie: {
    slug: "sprzatanie",
    name: "Sprzątanie / Cleaning",
    title: "Automatyczna recepcja AI dla firm sprzątających",
    subtitle: "Przyjmuj zamówienia na sprzątanie 24/7",
    description: "Klienci dzwonią z pytaniami o sprzątanie biur i domów. Asystent AI WitaLine przyjmuje zamówienia na usługi sprzątające, umawia terminy wizyt i informuje o cenniku.",
    benefits: ["Przyjmowanie zleceń sprzątania 24/7", "Umawianie terminów wizyt", "Informowanie o cenniku i ofercie", "Obsługa sprzątania regularnego i jednorazowego", "Automatyczne potwierdzenia SMS"],
    features: [{ icon: "🧹", title: "Zlecenia sprzątania", desc: "Asystent przyjmuje zamówienia na sprzątanie mieszkań, biur i domów." }, { icon: "📅", title: "Harmonogram", desc: "Umawianie terminów sprzątania regularnego i jednorazowego." }, { icon: "💰", title: "Cennik", desc: "Informowanie o cenach usług sprzątających." }, { icon: "📱", title: "Potwierdzenia", desc: "Automatyczne SMS-y z potwierdzeniem terminu." }],
    cta: "Sprawdź WitaLine dla sprzątania",
  },
  ksiegowosc: {
    slug: "ksiegowosc",
    name: "Księgowość / Finanse",
    title: "Automatyczna recepcja AI dla biur rachunkowych",
    subtitle: "Umawiaj spotkania i zbieraj leady 24/7",
    description: "Klienci dzwonią z pytaniami o rozliczenia i terminy. Asystent AI WitaLine umawia spotkania z księgowym, informuje o terminach rozliczeń i przyjmuje zapytania o usługi księgowe.",
    benefits: ["Umawianie spotkań z księgowym 24/7", "Informowanie o terminach rozliczeń", "Przyjmowanie zapytań o usługi", "Zbieranie dokumentów do kontaktu", "Integracja z kalendarzem"],
    features: [{ icon: "📊", title: "Spotkania", desc: "Asystent umawia spotkania z księgowym i doradcą podatkowym." }, { icon: "📅", title: "Terminy rozliczeń", desc: "Informowanie o terminach PIT, VAT, ZUS." }, { icon: "📋", title: "Zapytania ofertowe", desc: "Przyjmowanie zapytań o usługi księgowe." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y o zbliżających się terminach." }],
    cta: "Sprawdź WitaLine dla księgowości",
  },
  marketing: {
    slug: "marketing",
    name: "Marketing / Reklama",
    title: "Automatyczna recepcja AI dla agencji marketingowych",
    subtitle: "Przyjmuj zapytania i umawiaj spotkania 24/7",
    description: "Klienci dzwonią z pytaniami o usługi reklamowe. Asystent AI WitaLine przyjmuje zapytania ofertowe, umawia spotkania z klientami i zbiera leady do CRM.",
    benefits: ["Przyjmowanie zapytań ofertowych 24/7", "Umawianie spotkań z klientami", "Informowanie o usługach i cenach", "Zbieranie leadów do CRM", "Integracja z kalendarzem"],
    features: [{ icon: "📢", title: "Zapytania ofertowe", desc: "Asystent przyjmuje zapytania o usługi marketingowe i reklamowe." }, { icon: "📅", title: "Spotkania", desc: "Umawianie terminów spotkań z klientami." }, { icon: "📋", title: "Zbieranie briefu", desc: "Asystent zbiera wstępne informacje o potrzebach klienta." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę leadów i spotkań w panelu." }],
    cta: "Sprawdź WitaLine dla marketingu",
  },
  consulting: {
    slug: "consulting",
    name: "Doradztwo / Consulting",
    title: "Automatyczna recepcja AI dla firm doradczych",
    subtitle: "Umawiaj spotkania i zbieraj leady 24/7",
    description: "Klienci dzwonią z pytaniami o usługi doradcze. Asystent AI WitaLine umawia spotkania z doradcami, przyjmuje zapytania o usługi i zbiera dane klientów.",
    benefits: ["Umawianie spotkań doradczych 24/7", "Przyjmowanie zapytań o usługi", "Zbieranie danych klientów", "Informowanie o specjalizacji firmy", "Integracja z kalendarzem"],
    features: [{ icon: "💼", title: "Spotkania doradcze", desc: "Asystent umawia konsultacje i spotkania biznesowe." }, { icon: "📋", title: "Zapytania ofertowe", desc: "Przyjmowanie zapytań o usługi doradcze." }, { icon: "🎯", title: "Kwalifikacja", desc: "Wstępna kwalifikacja potrzeb klienta przed spotkaniem." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę leadów i spotkań." }],
    cta: "Sprawdź WitaLine dla consultingu",
  },
  ubezpieczenia: {
    slug: "ubezpieczenia",
    name: "Ubezpieczenia",
    title: "Automatyczna recepcja AI dla agentów ubezpieczeniowych",
    subtitle: "Umawiaj spotkania i wyceniaj polisy 24/7",
    description: "Klienci dzwonią z pytaniami o ubezpieczenia. Asystent AI WitaLine umawia spotkania z agentem, przyjmuje zapytania o ofertę i zbiera leady.",
    benefits: ["Umawianie spotkań z agentem 24/7", "Przyjmowanie zapytań o polisy", "Informowanie o rodzajach ubezpieczeń", "Zbieranie leadów do CRM", "Integracja z kalendarzem"],
    features: [{ icon: "🛡️", title: "Spotkania", desc: "Asystent umawia spotkania z agentem ubezpieczeniowym." }, { icon: "📋", title: "Zapytania ofertowe", desc: "Przyjmowanie zapytań o OC, AC, życie i zdrowotne." }, { icon: "💰", title: "Wyceny", desc: "Wstępne wyceny składek ubezpieczeniowych." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę leadów i spotkań." }],
    cta: "Sprawdź WitaLine dla ubezpieczeń",
  },
  ogrodnictwo: {
    slug: "ogrodnictwo",
    name: "Ogrodnictwo / Zieleniec",
    title: "Automatyczna recepcja AI dla firm ogrodniczych",
    subtitle: "Przyjmuj zamówienia na usługi ogrodowe 24/7",
    description: "Klienci dzwonią z pytaniami o pielęgnację ogrodów. Asystent AI WitaLine przyjmuje zamówienia na koszenie, sadzenie i projektowanie ogrodów, umawia wizyty na wycenę.",
    benefits: ["Przyjmowanie zleceń ogrodniczych 24/7", "Umawianie wizyt na wycenę", "Informowanie o cenniku usług", "Sezonowe przypomnienia SMS", "Integracja z kalendarzem"],
    features: [{ icon: "🌿", title: "Zlecenia ogrodowe", desc: "Asystent przyjmuje zamówienia na koszenie, sadzenie i projektowanie." }, { icon: "📅", title: "Wyceny", desc: "Umawianie terminów wizyt na wycenę ogrodu." }, { icon: "💰", title: "Cennik", desc: "Informowanie o cenach usług ogrodniczych." }, { icon: "📱", title: "Przypomnienia", desc: "Sezonowe przypomnienia o pielęgnacji ogrodu." }],
    cta: "Sprawdź WitaLine dla ogrodnictwa",
  },
  eventy: {
    slug: "eventy",
    name: "Eventy / Rozrywka",
    title: "Automatyczna recepcja AI dla firm eventowych",
    subtitle: "Przyjmuj zapytania o organizację eventów 24/7",
    description: "Klienci dzwonią z pytaniami o organizację wesel, konferencji i imprez. Asystent AI WitaLine przyjmuje zapytania, umawia spotkania i rezerwuje terminy.",
    benefits: ["Przyjmowanie zapytań o eventy 24/7", "Umawianie spotkań z klientami", "Rezerwacja terminów w kalendarzu", "Informowanie o ofercie i cenach", "Zbieranie leadów"],
    features: [{ icon: "🎪", title: "Zapytania eventowe", desc: "Asystent przyjmuje zapytania o organizację wesel, konferencji i imprez." }, { icon: "📅", title: "Rezerwacja terminów", desc: "Sprawdzanie dostępności i rezerwacja dat w kalendarzu." }, { icon: "📋", title: "Brief eventu", desc: "Zbieranie wstępnych informacji o planowanym evencie." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę zapytań i rezerwacji." }],
    cta: "Sprawdź WitaLine dla eventów",
  },
  apteka: {
    slug: "apteka",
    name: "Apteka",
    title: "Automatyczna recepcja AI dla aptek",
    subtitle: "Sprawdzaj dostępność leków 24/7",
    description: "Klienci dzwonią z pytaniami o dostępność leków i godziny otwarcia. Asystent AI WitaLine sprawdza dostępność, przyjmuje zamówienia na leki i umawia konsultacje z farmaceutą.",
    benefits: ["Sprawdzanie dostępności leków 24/7", "Przyjmowanie zamówień na receptę", "Informowanie o godzinach otwarcia", "Konsultacje z farmaceutą", "Rezerwacje leków"],
    features: [{ icon: "💊", title: "Dostępność leków", desc: "Asystent sprawdza i informuje o dostępności leków." }, { icon: "📋", title: "Zamówienia", desc: "Przyjmowanie zamówień na leki na receptę." }, { icon: "🕐", title: "Godziny otwarcia", desc: "Informowanie o godzinach otwarcia i dyżurach." }, { icon: "👨‍⚕️", title: "Konsultacje", desc: "Umawianie konsultacji z farmaceutą." }],
    cta: "Sprawdź WitaLine dla aptek",
  },
  optyk: {
    slug: "optyk",
    name: "Optyk",
    title: "Automatyczna recepcja AI dla salonów optycznych",
    subtitle: "Umawiaj wizyty i badania wzroku 24/7",
    description: "Klienci dzwonią z pytaniami o okulary i badania wzroku. Asystent AI WitaLine umawia wizyty u optyka, informuje o ofercie i przyjmuje zamówienia na soczewki.",
    benefits: ["Umawianie wizyt u optyka 24/7", "Informowanie o ofercie okularów i soczewek", "Przyjmowanie zamówień na soczewki", "Przypominanie o badaniach kontrolnych", "Integracja z kalendarzem"],
    features: [{ icon: "👓", title: "Wizyty u optyka", desc: "Asystent umawia badania wzroku i dobór okularów." }, { icon: "📋", title: "Zamówienia", desc: "Przyjmowanie zamówień na soczewki kontaktowe." }, { icon: "🕐", title: "Terminy odbioru", desc: "Informowanie o terminach odbioru zamówionych okularów." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y o badaniach kontrolnych." }],
    cta: "Sprawdź WitaLine dla optyków",
  },
  "serwis-komputerow": {
    slug: "serwis-komputerow",
    name: "Serwis komputerów",
    title: "Automatyczna recepcja AI dla serwisów komputerowych",
    subtitle: "Przyjmuj zgłoszenia napraw 24/7",
    description: "Klienci dzwonią z awariami sprzętu. Asystent AI WitaLine przyjmuje zgłoszenia napraw, umawia terminy oddania sprzętu i informuje o statusie naprawy.",
    benefits: ["Przyjmowanie zgłoszeń napraw 24/7", "Umawianie terminów oddania sprzętu", "Sprawdzanie statusu naprawy", "Informowanie o cenniku", "Automatyczne powiadomienia SMS"],
    features: [{ icon: "💻", title: "Zgłoszenia napraw", desc: "Asystent przyjmuje zgłoszenia i diagnozuje problem." }, { icon: "📅", title: "Terminy", desc: "Umawianie dogodnych terminów oddania i odbioru sprzętu." }, { icon: "🔍", title: "Status naprawy", desc: "Sprawdzanie i informowanie o statusie naprawy." }, { icon: "💰", title: "Wyceny", desc: "Informowanie o cenniku usług serwisowych." }],
    cta: "Sprawdź WitaLine dla serwisów",
  },
  hydraulik: {
    slug: "hydraulik",
    name: "Hydraulik / Elektryk",
    title: "Automatyczna recepcja AI dla hydraulików i elektryków",
    subtitle: "Przyjmuj zgłoszenia awarii 24/7",
    description: "Klienci dzwonią z awariami hydraulicznymi i elektrycznymi. Asystent AI WitaLine przyjmuje zgłoszenia, priorytetyzuje awarie i umawia wizyty serwisowe.",
    benefits: ["Przyjmowanie zgłoszeń awarii 24/7", "Priorytetyzacja awarii (zalanie, brak prądu)", "Umawianie wizyt serwisowych", "Informowanie o cenniku", "Automatyczne powiadomienia SMS"],
    features: [{ icon: "🔧", title: "Zgłoszenia awarii", desc: "Asystent przyjmuje zgłoszenia awarii hydraulicznych i elektrycznych." }, { icon: "🚨", title: "Priorytetyzacja", desc: "Pilne awarie (zalanie, brak prądu) są natychmiast kierowane do serwisu." }, { icon: "📅", title: "Wizyty serwisowe", desc: "Umawianie terminów napraw i przeglądów." }, { icon: "💰", title: "Wyceny", desc: "Informowanie o cenniku usług." }],
    cta: "Sprawdź WitaLine dla hydraulików",
  },
  spa: {
    slug: "spa",
    name: "SPA / Sauna / Wellness",
    title: "Automatyczna recepcja AI dla SPA",
    subtitle: "Umawiaj wizyty na zabiegi 24/7",
    description: "Klienci dzwonią z pytaniami o zabiegi i pakiety. Asystent AI WitaLine umawia wizyty na masaże i zabiegi, informuje o ofercie SPA i przyjmuje zapytania o pakiety.",
    benefits: ["Umawianie wizyt SPA 24/7", "Informowanie o zabiegach i pakietach", "Przyjmowanie zapytań o ceny", "Automatyczne przypomnienia SMS", "Integracja z kalendarzem"],
    features: [{ icon: "🧖", title: "Rezerwacja SPA", desc: "Asystent umawia masaże, zabiegi kosmetyczne i pakiety SPA." }, { icon: "📋", title: "Oferta zabiegów", desc: "Informowanie o pełnej ofercie zabiegów i pakietów." }, { icon: "💰", title: "Cennik", desc: "Podawanie cen zabiegów i promocji." }, { icon: "📱", title: "Przypomnienia", desc: "Automatyczne SMS-y o nadchodzących wizytach." }],
    cta: "Sprawdź WitaLine dla SPA",
  },
  jubiler: {
    slug: "jubiler",
    name: "Jubiler / Zegarmistrz",
    title: "Automatyczna recepcja AI dla salonów jubilerskich",
    subtitle: "Przyjmuj zapytania i umawiaj przymiarki 24/7",
    description: "Klienci dzwonią z pytaniami o biżuterię i zegarki. Asystent AI WitaLine przyjmuje zapytania o produkty, umawia wizyty na przymiarki i informuje o naprawach.",
    benefits: ["Przyjmowanie zapytań o biżuterię 24/7", "Umawianie wizyt na przymiarki", "Informowanie o naprawach zegarków", "Zamówienia na wyroby na zamówienie", "Automatyczne potwierdzenia SMS"],
    features: [{ icon: "💍", title: "Zapytania produktowe", desc: "Asystent odpowiada na pytania o biżuterię i zegarki." }, { icon: "📅", title: "Przymiarki", desc: "Umawianie wizyt na przymiarki w salonie." }, { icon: "🔧", title: "Naprawy", desc: "Przyjmowanie zleceń napraw zegarków i biżuterii." }, { icon: "📋", title: "Zamówienia", desc: "Przyjmowanie zamówień na wyroby na specjalne zamówienie." }],
    cta: "Sprawdź WitaLine dla jubilerów",
  },
  pralnia: {
    slug: "pralnia",
    name: "Pralnia chemiczna",
    title: "Automatyczna recepcja AI dla pralni chemicznych",
    subtitle: "Przyjmuj zamówienia na pranie 24/7",
    description: "Klienci dzwonią z pytaniami o pranie i terminy odbioru. Asystent AI WitaLine przyjmuje zamówienia na pranie odzieży, informuje o cenniku i potwierdza gotowość.",
    benefits: ["Przyjmowanie zamówień na pranie 24/7", "Informowanie o cenniku", "Potwierdzanie gotowości zamówienia", "Informowanie o terminach odbioru", "Automatyczne SMS-y"],
    features: [{ icon: "👕", title: "Zamówienia prania", desc: "Asystent przyjmuje zamówienia na pranie odzieży i czyszczenie obuwia." }, { icon: "💰", title: "Cennik", desc: "Informowanie o cenach usług pralni chemicznej." }, { icon: "✅", title: "Gotowość", desc: "Potwierdzanie gotowości zamówienia do odbioru." }, { icon: "📱", title: "Powiadomienia", desc: "Automatyczne SMS-y o gotowości zamówienia." }],
    cta: "Sprawdź WitaLine dla pralni",
  },
  ochrona: {
    slug: "ochrona",
    name: "Ochrona / Detektywistyka",
    title: "Automatyczna recepcja AI dla firm ochroniarskich",
    subtitle: "Przyjmuj zapytania o usługi ochrony 24/7",
    description: "Klienci dzwonią z pytaniami o monitoring i ochronę. Asystent AI WitaLine przyjmuje zapytania ofertowe, umawia spotkania z doradcą i zbiera leady.",
    benefits: ["Przyjmowanie zapytań o ochronę 24/7", "Umawianie spotkań z doradcą", "Informowanie o usługach monitoringu", "Zbieranie leadów do CRM", "Integracja z kalendarzem"],
    features: [{ icon: "🔒", title: "Zapytania ofertowe", desc: "Asystent przyjmuje zapytania o monitoring i ochronę fizyczną." }, { icon: "📅", title: "Spotkania", desc: "Umawianie terminów spotkań z doradcą." }, { icon: "📋", title: "Wyceny", desc: "Przygotowanie do wyceny usług ochrony." }, { icon: "📊", title: "Raporty", desc: "Śledź liczbę leadów i spotkań." }],
    cta: "Sprawdź WitaLine dla ochrony",
  },
  winiarnia: {
    slug: "winiarnia",
    name: "Winiarnia / Alkohole",
    title: "Automatyczna recepcja AI dla winiarni",
    subtitle: "Przyjmuj zamówienia i rezerwuj degustacje 24/7",
    description: "Klienci dzwonią z pytaniami o wina i zamówienia. Asystent AI WitaLine przyjmuje zamówienia, informuje o dostępności i przyjmuje rezerwacje na degustacje.",
    benefits: ["Przyjmowanie zamówień win 24/7", "Rezerwacja degustacji", "Informowanie o dostępności produktów", "Godziny otwarcia i promocje", "Automatyczne potwierdzenia SMS"],
    features: [{ icon: "🍷", title: "Zamówienia", desc: "Asystent przyjmuje zamówienia na wina i alkohole." }, { icon: "📅", title: "Degustacje", desc: "Rezerwacja terminów degustacji wina." }, { icon: "📋", title: "Dostępność", desc: "Sprawdzanie i informowanie o dostępności produktów." }, { icon: "🕐", title: "Godziny otwarcia", desc: "Informowanie o godzinach otwarcia i promocjach." }],
    cta: "Sprawdź WitaLine dla winiarni",
  },
  wypozyczalnia: {
    slug: "wypozyczalnia",
    name: "Wypożyczalnia sprzętu",
    title: "Automatyczna recepcja AI dla wypożyczalni sprzętu",
    subtitle: "Przyjmuj rezerwacje sprzętu 24/7",
    description: "Klienci dzwonią z pytaniami o dostępność sprzętu. Asystent AI WitaLine przyjmuje rezerwacje, informuje o dostępności i cenniku, umawia odbiór i zwrot sprzętu.",
    benefits: ["Rezerwacja sprzętu 24/7 przez telefon", "Sprawdzanie dostępności", "Informowanie o cenniku wypożyczenia", "Umawianie odbioru i zwrotu", "Automatyczne potwierdzenia SMS"],
    features: [{ icon: "🚜", title: "Rezerwacje sprzętu", desc: "Asystent przyjmuje rezerwacje i sprawdza dostępność." }, { icon: "💰", title: "Cennik", desc: "Informowanie o cenach wypożyczenia sprzętu." }, { icon: "📅", title: "Odbiór i zwrot", desc: "Umawianie terminów odbioru i zwrotu sprzętu." }, { icon: "📱", title: "Potwierdzenia", desc: "Automatyczne SMS-y z potwierdzeniem rezerwacji." }],
    cta: "Sprawdź WitaLine dla wypożyczalni",
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

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#0d9488] tracking-tight">WitaLine</Link>
        <div className="flex items-center gap-6">
          <a href={`tel:${WITALINE_PHONE_NUMBER}`} className="text-sm text-zinc-500 hover:text-zinc-900 hidden sm:flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {WITALINE_PHONE_DISPLAY}
          </a>
          <Link href="/register" className="bg-[#0d9488] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#34a840] transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
            Wypróbuj za darmo
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero({ industry }: { industry: IndustryConfig }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Automatyczna recepcja AI dla {industry.name.toLowerCase()}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 leading-[1.1] tracking-tight mb-6">
            {industry.title}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto mb-4 leading-relaxed">
            {industry.subtitle}
          </p>
          <p className="text-base text-zinc-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            {industry.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-[#0d9488] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#34a840] transition-all shadow-lg shadow-green-200 hover:shadow-xl active:scale-[0.98] w-full sm:w-auto text-center"
            >
              {industry.cta}
            </Link>
            <a
              href={`tel:${WITALINE_PHONE_NUMBER}`}
              className="text-zinc-500 hover:text-zinc-900 text-base flex items-center gap-2 transition-colors px-6 py-4 border border-zinc-200 rounded-xl hover:border-zinc-300 w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {WITALINE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-xs text-zinc-400 text-center uppercase tracking-widest font-medium mb-6">Zaufały nam firmy w całej Polsce</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-zinc-300">
          {["Gastronomia", "Medycyna", "Prawo", "Hotelarstwo", "E-commerce", "Transport"].map((name) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </div>
              <span className="text-sm font-medium text-zinc-500">{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Ponad 500 firm</span>
          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 98% odebranych połączeń</span>
          <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Średnia ocena 4.8/5</span>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Firm korzysta z WitaLine" },
            { value: "98%", label: "Odbieranych połączeń" },
            { value: "4.8", label: "Średnia ocena klientów" },
            { value: "24/7", label: "Obsługa bez przerw" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#0d9488] mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits({ industry }: { industry: IndustryConfig }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Co zyskujesz z WitaLine?</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Twój asystent AI pracuje 24/7 — Ty zajmij się tym co najważniejsze.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {industry.benefits.map((b, i) => (
            <div key={i} className="group flex items-start gap-4 p-5 rounded-2xl bg-green-50/50 hover:bg-green-50 border border-green-100/50 hover:border-green-200 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-zinc-700 text-sm leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Jak to działa?</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">W trzy proste kroki uruchomisz automatyczną recepcję w swojej firmie.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "01", title: "Konfiguracja", desc: "Podaj nam swój numer telefonu i opisz godziny pracy. Resztą zajmiemy się za Ciebie." },
            { step: "02", title: "Personalizacja", desc: "Dostosuj scenariusze rozmów do swojej branży. Asystent AI uczy się Twojej firmy." },
            { step: "03", title: "Gotowe!", desc: "Przekieruj połączenia na WitaLine. Asystent odbiera rozmowy 24/7, Ty dostajesz raporty." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0d9488] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ industry }: { industry: IndustryConfig }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Funkcje dopasowane do Twojej branży</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">WitaLine rozumie specyfikę {industry.name.toLowerCase()} i automatyzuje to, co najważniejsze.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industry.features.map((f, i) => (
            <div key={i} className="group bg-white rounded-2xl p-6 border border-zinc-100 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300">
              <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
              <h3 className="font-semibold text-zinc-900 mb-2 group-hover:text-[#0d9488] transition-colors">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-4">Elastyczny model cenowy</div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-4">Płacisz tylko za użycie</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Bez abonamentu, bez zobowiązań. Im więcej minut, tym niższa stawka. Zacznij od 15 minut za darmo.
              </p>
              <Link
                href="/register"
                className="inline-flex bg-[#0d9488] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#34a840] transition-all shadow-sm"
              >
                Sprawdź cennik
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { min: "0–500", rate: "1,20 zł/min" },
                { min: "501–1 000", rate: "1,10 zł/min" },
                { min: "1 001–2 000", rate: "1,00 zł/min" },
                { min: "2 001–3 000", rate: "0,95 zł/min" },
                { min: "3 001–5 000", rate: "0,90 zł/min" },
                { min: "5 001+", rate: "0,85 zł/min" },
              ].map((tier) => (
                <div key={tier.min} className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 hover:bg-green-50 transition-colors">
                  <span className="text-sm text-zinc-600">{tier.min} min</span>
                  <span className="text-sm font-semibold text-zinc-900">{tier.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ({ industry }: { industry: IndustryConfig }) {
  const faqs: { q: string; a: string }[] = [
    {
      q: `Czy asystent AI rozumie specyfikę ${industry.name.toLowerCase()}?`,
      a: `Tak. WitaLine został przeszkolony w branży ${industry.name.toLowerCase()}. Rozumie terminologię, procesy i typowe zapytania klientów. Możesz też dodać własne instrukcje przez panel zarządzania.`,
    },
    {
      q: "Czy mogę w każdej chwili przejąć rozmowę?",
      a: "Tak. Gdy klient potrzebuje konsultanta, asystent automatycznie przełącza rozmowę na wybraną osobę w Twojej firmie. Nic nie stracisz.",
    },
    {
      q: "Jak szybko mogę uruchomić WitaLine?",
      a: "Konfiguracja zajmuje mniej niż 15 minut. Przekieruj numer na nasz system i gotowe. Oferujemy wsparcie na każdym etapie.",
    },
    {
      q: "Czy są jakieś opłaty stałe?",
      a: "Nie. Płacisz wyłącznie za wykorzystane minuty. Im więcej rozmów, tym niższa stawka. Darmowy okres próbny obejmuje 15 minut rozmów i 10 SMS-ów.",
    },
    {
      q: "Jakie dane zbiera asystent?",
      a: "Asystent zapisuje transkrypcje rozmów, dane kontaktowe i preferencje klientów. Wszystkie dane są przechowywane zgodnie z RODO na serwerach w Europie.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Najczęstsze pytania</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Masz więcej pytań? Zadzwoń do nas — chętnie odpowiemy.</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-zinc-200 open:border-green-200 open:bg-green-50/30 transition-all">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                <span className="text-sm font-medium text-zinc-900 group-open:text-[#0d9488] transition-colors">{faq.q}</span>
                <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 group-open:text-[#0d9488] transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-4">
                <p className="text-sm text-zinc-600 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ industry }: { industry: IndustryConfig }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-600 to-green-700 py-20 sm:py-28">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTI0IDIydjItMTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Gotowy na automatyzację?</h2>
        <p className="text-green-100 text-lg mb-4">Wypróbuj WitaLine za darmo przez 7 dni. 15 minut darmowych rozmów i 10 SMS-ów.</p>
        <p className="text-green-200/80 text-sm mb-10">Bez karty kredytowej. Bez zobowiązań.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-white text-green-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-50 transition-all shadow-xl active:scale-[0.98] w-full sm:w-auto text-center"
          >
            Zacznij za darmo
          </Link>
          <a
            href={`tel:${WITALINE_PHONE_NUMBER}`}
            className="text-white/80 hover:text-white text-base flex items-center gap-2 transition-colors px-6 py-4 border border-white/20 rounded-xl w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {WITALINE_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-zinc-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="text-xl font-bold text-white tracking-tight">WitaLine</Link>
            <p className="text-zinc-400 text-sm mt-3 leading-relaxed">Automatyczna recepcja AI dla Twojej firmy. Odbieramy połączenia 24/7.</p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2">
              {[{ href: "/", label: "Strona główna" }, { href: "/register", label: "Rejestracja" }, { href: "/#cennik", label: "Cennik" }].map((link) => (
                <li key={link.href}><Link href={link.href} className="text-zinc-400 text-sm hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2">
              <li><a href={`tel:${WITALINE_PHONE_NUMBER}`} className="text-zinc-400 text-sm hover:text-white transition-colors">{WITALINE_PHONE_DISPLAY}</a></li>
              <li><a href="mailto:witam@witaline.pl" className="text-zinc-400 text-sm hover:text-white transition-colors">witam@witaline.pl</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Dokumenty</h4>
            <ul className="space-y-2">
              {[{ href: "/regulamin", label: "Regulamin" }, { href: "/polityka-prywatnosci", label: "Polityka prywatności" }].map((link) => (
                <li key={link.href}><Link href={link.href} className="text-zinc-400 text-sm hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} WitaLine. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}

export default function IndustryLandingPage({ industry }: { industry: IndustryConfig }) {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero industry={industry} />
      <TrustBar />
      <Benefits industry={industry} />
      <HowItWorks />
      <Features industry={industry} />
      <PricingPreview />
      <FAQ industry={industry} />
      <CTA industry={industry} />
      <Footer />
    </main>
  );
}
