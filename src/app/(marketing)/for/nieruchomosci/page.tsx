import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla biur nieruchomości | WitaLine",
  description: "Umawiaj oględziny nieruchomości i zbieraj leady 24/7. Asystent AI WitaLine odbiera każde połączenie.",
};

export default function Page() {
  const config = getIndustryConfig("nieruchomosci");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
