import type { Metadata } from "next";
import HomePage from "./home-page";

export const metadata: Metadata = {
  title: "Automatyczna Recepcja AI 24/7 — Asystent Głosowy dla Firm | WitaLine",
  description:
    "System Gwarantowanego Odbierania Klientów. Asystent głosowy AI odbiera zamówienia, umawia wizyty i odpowiada na pytania 24/7. Konfiguracja w 3 minuty, 7 dni za darmo.",
  openGraph: {
    title: "WitaLine — Automatyczna Recepcja AI 24/7 dla Firm",
    description:
      "Odbieramy każdy telefon. Asystent AI pracuje 24/7. Ponad 200 firm już oszczędza średnio 4000+ PLN miesięcznie. 30-dniowa gwarancja zwrotu.",
    url: "https://witaline.pl",
  },
};

export default function Page() {
  return <HomePage />;
}
