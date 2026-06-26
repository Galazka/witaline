import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm budowlanych | WitaLine",
  description: "Przyjmuj zapytania o wyceny remontów i budowy 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("budownictwo");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
