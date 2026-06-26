import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm transportowych | WitaLine",
  description: "Przyjmuj zlecenia transportowe i sprawdzaj status przesyłek 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("transport");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
