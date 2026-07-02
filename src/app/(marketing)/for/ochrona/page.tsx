import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm ochroniarskich | WitaLine",
  description: "Przyjmuj zapytania o monitoring i ochronę fizyczną 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("ochrona");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
