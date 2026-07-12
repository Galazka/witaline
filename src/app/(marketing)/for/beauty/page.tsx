import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla salonów beauty | WitaLine",
  description: "Umawiaj wizyty w salonie fryzjerskim i beauty 24/7. Asystent AI odbiera telefony i rezerwuje terminy. Sprawdź za darmo.",
};

export default function Page() {
  const config = getIndustryConfig("beauty");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
