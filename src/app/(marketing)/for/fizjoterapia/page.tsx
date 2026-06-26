import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla fizjoterapii | WitaLine",
  description: "Umawiaj wizyty rehabilitacyjne i przyjmuj zgłoszenia pourazowe 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("fizjoterapia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
