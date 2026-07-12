import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm IT | WitaLine",
  description: "Przyjmuj zgłoszenia serwisowe i umawiaj konsultacje techniczne 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("it");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
