import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla pralni chemicznych | WitaLine",
  description: "Przyjmuj zamówienia na pranie odzieży 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("pralnia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
