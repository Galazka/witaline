import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla hydraulików i elektryków | WitaLine",
  description: "Przyjmuj zgłoszenia awarii (zalanie, brak prądu) 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("hydraulik");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
