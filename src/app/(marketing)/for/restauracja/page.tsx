import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla restauracji | WitaLine",
  description: "Odbieraj zamówienia na wynos i rezerwacje stolików 24/7. Asystent AI dla gastronomii — zero straconych połączeń. Sprawdź za darmo.",
};

export default function Page() {
  const config = getIndustryConfig("restauracja");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
