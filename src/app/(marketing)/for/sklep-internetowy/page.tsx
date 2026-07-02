import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla e-commerce | WitaLine",
  description: "Przyjmuj zamówienia telefoniczne i sprawdzaj status przesyłek 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("sklep-internetowy");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
