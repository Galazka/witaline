import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla kancelarii prawnej | WitaLine",
  description: "Umawiaj konsultacje prawne 24/7. Asystent AI zbiera informacje o sprawie i przekazuje prawnikowi. Sprawdź za darmo.",
};

export default function Page() {
  const config = getIndustryConfig("prawo");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
