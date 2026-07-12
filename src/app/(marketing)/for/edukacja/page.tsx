import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla szkół i korepetytorów | WitaLine",
  description: "Zapisuj na lekcje i kursy 24/7. Asystent AI WitaLine umawia lekcje indywidualne i grupowe.",
};

export default function Page() {
  const config = getIndustryConfig("edukacja");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
