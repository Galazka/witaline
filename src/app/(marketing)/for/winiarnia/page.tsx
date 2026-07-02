import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla winiarni | WitaLine",
  description: "Przyjmuj zamówienia win i rezerwuj degustacje 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("winiarnia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
