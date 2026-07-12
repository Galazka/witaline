import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla SPA | WitaLine",
  description: "Umawiaj wizyty na masaże i zabiegi wellness 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("spa");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
