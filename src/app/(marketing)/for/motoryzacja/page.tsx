import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla warsztatów | WitaLine",
  description: "Umawiaj wizyty na przeglądy i naprawy 24/7. Asystent AI WitaLine odbiera każde połączenie.",
};

export default function Page() {
  const config = getIndustryConfig("motoryzacja");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
