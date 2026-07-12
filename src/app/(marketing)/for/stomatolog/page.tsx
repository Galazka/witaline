import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla gabinetów stomatologicznych | WitaLine",
  description: "Rejestracja pacjentów 24/7 i przyjmowanie zgłoszeń pilnych przez telefon.",
};

export default function Page() {
  const config = getIndustryConfig("stomatolog");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
