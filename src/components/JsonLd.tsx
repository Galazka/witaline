import { WITALINE_PHONE_NUMBER } from "@/lib/constants";

const APP_URL = "https://witaline.pl";

const faqEntries = [
  { q: "Czym jest WitaLine?", a: "WitaLine to automatyczna recepcja AI, która odbiera telefony 24/7, przyjmuje zamówienia, umawia wizyty i odpowiada na pytania klientów za pomocą naturalnej rozmowy głosowej." },
  { q: "Jak działa asystent AI?", a: "Asystent AI WitaLine używa zaawansowanych modeli językowych i syntezy mowy ElevenLabs, aby prowadzić naturalne rozmowy telefoniczne z klientami. Rozpoznaje intencje, przyjmuje rezerwacje, zapisuje leady i w razie potrzeby przełącza na konsultanta." },
  { q: "Ile kosztuje WitaLine?", a: "WitaLine działa w modelu elastycznym — nie ma stałej opłaty miesięcznej. Płacisz tylko za wykorzystane minuty rozmów. Ceny zaczynają się od 1,00 PLN/min brutto i maleją wraz z większym wolumenem." },
  { q: "Czy potrzebuję własnego numeru telefonu?", a: "Tak, potrzebujesz polskiego numeru telefonu od operatora takiego jak Orange, T-Mobile, Play lub Plus. Możesz też przenieść istniejący numer do nas." },
  { q: "Jakie branże obsługuje WitaLine?", a: "WitaLine sprawdza się w każdej branży, która przyjmuje zamówienia telefoniczne: restauracje, bary, pizzerie, salony beauty, fryzjerskie, medycyna, stomatologia, rehabilitacja, prawnicy, kancelarie, hotele, warsztaty i wiele innych." },
  { q: "Czy mogę przetestować WitaLine za darmo?", a: "Tak, oferujemy 7-dniowy okres próbny z 15 minutami darmowych rozmów i 10 darmowymi SMS-ami. Możesz w pełni przetestować system przed podjęciem decyzji." },
  { q: "Jak skonfigurować asystenta?", a: "Po rejestracji otrzymasz dostęp do panelu, gdzie możesz edytować prompt asystenta, dodać bazę wiedzy o firmie, ustawić godziny pracy i skonfigurować usługi." },
  { q: "Czy WitaLine integruje się z kalendarzem Google?", a: "Tak, WitaLine obsługuje integrację z Google Calendar. Asystent może automatycznie sprawdzać dostępność i umawiać wizyty w Twoim kalendarzu." },
  { q: "Co się stanie, gdy asystent nie poradzi sobie z pytaniem?", a: "Asystent może przełączyć rozmowę na konsultanta. Ty decydujesz, które numery i w jakiej kolejności mają być powiadamiane." },
  { q: "Czy WitaLine obsługuje język angielski?", a: "Tak, asystent automatycznie wykrywa język rozmowy i może odpowiadać zarówno po polsku, jak i po angielsku." },
];

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        name: "WitaLine",
        url: APP_URL,
        logo: `${APP_URL}/logo.png`,
        description: "Automatyczna recepcja AI 24/7 dla firm. Asystent głosowy odbiera połączenia, przyjmuje zamówienia i umawia wizyty.",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: WITALINE_PHONE_NUMBER,
          contactType: "sales",
          availableLanguage: ["Polish", "English"],
        },
        sameAs: [APP_URL],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${APP_URL}/#software`,
        name: "WitaLine",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "System Gwarantowanego Odbierania Klientów. Asystent głosowy AI odbiera zamówienia i umawia wizyty 24/7.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "PLN",
          description: "Start from 0 PLN/month, pay per minute",
        },
      },
      {
        "@type": "Product",
        "@id": `${APP_URL}/#product`,
        name: "Automatyczna Recepcja AI",
        description: "Wirtualna recepcjonistka oparta na AI. Odbiera telefony, odpowiada na pytania, przyjmuje zamówienia i rezerwacje 24/7.",
        brand: "WitaLine",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "PLN",
          lowPrice: "0",
          highPrice: "999",
          offerCount: "6",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        url: APP_URL,
        name: "WitaLine - Automatyczna Recepcja AI",
        description: "Automatyczna recepcja AI 24/7. Odbieraj zamówienia i umawiaj wizyty bez angażowania personelu.",
        inLanguage: ["pl", "en"],
        potentialAction: {
          "@type": "SearchAction",
          target: `${APP_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${APP_URL}/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: APP_URL },
          { "@type": "ListItem", position: 2, name: "Cennik", item: `${APP_URL}/#cennik` },
          { "@type": "ListItem", position: 3, name: "FAQ", item: `${APP_URL}/#faq` },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${APP_URL}/#faq`,
        mainEntity: faqEntries.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: {
            "@type": "Answer",
            text: a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
