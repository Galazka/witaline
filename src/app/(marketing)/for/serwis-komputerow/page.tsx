import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla serwisów komputerowych | WitaLine",
  description: "Przyjmuj zgłoszenia napraw komputerów i laptopów 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("serwis-komputerow");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
