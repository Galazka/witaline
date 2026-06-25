import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla medycyny i stomatologii | WitaLine",
  description: "Rejestracja pacjentów 24/7. Asystent AI umawia wizyty, odbiera zapytania i odciąża recepcję. Sprawdź za darmo.",
};

export default function Page() {
  const config = getIndustryConfig("medycyna");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
