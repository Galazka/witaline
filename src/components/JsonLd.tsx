export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://witaline.pl/#organization",
        name: "WitaLine",
        url: "https://witaline.pl",
        logo: "https://witaline.pl/logo.png",
        description: "Automatyczna recepcja AI 24/7 dla firm. Asystent głosowy odbiera połączenia, przyjmuje zamówienia i umawia wizyty.",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+48-732-125-752",
          contactType: "sales",
          availableLanguage: ["Polish", "English"],
        },
        sameAs: [
          "https://witaline.pl",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://witaline.pl/#software",
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
        "@id": "https://witaline.pl/#product",
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
