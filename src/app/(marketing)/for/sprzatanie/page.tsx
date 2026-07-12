import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm sprzątających | WitaLine",
  description: "Przyjmuj zamówienia na sprzątanie biur i domów 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("sprzatanie");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
