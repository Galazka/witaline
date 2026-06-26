import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla wypożyczalni sprzętu | WitaLine",
  description: "Rezerwacja sprzętu przez telefon i sprawdzanie dostępności 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("wypozyczalnia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
