import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla aptek | WitaLine",
  description: "Sprawdzaj dostępność leków i przyjmuj zamówienia na receptę 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("apteka");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
