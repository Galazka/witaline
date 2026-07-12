import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm eventowych | WitaLine",
  description: "Przyjmuj zapytania o organizację wesel i konferencji 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("eventy");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
