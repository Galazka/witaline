import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla hoteli | WitaLine",
  description: "Rezerwuj pokoje i odpowiadaj gościom 24/7. Asystent AI dla hoteli po polsku i angielsku. Sprawdź za darmo.",
};

export default function Page() {
  const config = getIndustryConfig("hotel");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
