import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla salonów jubilerskich | WitaLine",
  description: "Przyjmuj zapytania o biżuterię i umawiaj przymiarki 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("jubiler");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
