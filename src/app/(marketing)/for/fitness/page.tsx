import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla klubów fitness | WitaLine",
  description: "Zapisy na zajęcia grupowe i treningi personalne 24/7. Asystent AI WitaLine odbiera każde połączenie.",
};

export default function Page() {
  const config = getIndustryConfig("fitness");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
