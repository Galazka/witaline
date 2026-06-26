import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla kwiaciarni | WitaLine",
  description: "Przyjmuj zamówienia kwiatów i doradzaj w wyborze bukietów 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("kwiaciarnia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
