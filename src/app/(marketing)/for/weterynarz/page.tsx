import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla gabinetów weterynaryjnych | WitaLine",
  description: "Umawiaj wizyty dla zwierząt 24/7. Asystent AI WitaLine z empatią i profesjonalizmem.",
};

export default function Page() {
  const config = getIndustryConfig("weterynarz");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
