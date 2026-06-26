import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm ogrodniczych | WitaLine",
  description: "Przyjmuj zamówienia na usługi ogrodowe i koszenie trawy 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("ogrodnictwo");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
