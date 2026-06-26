import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla biur rachunkowych | WitaLine",
  description: "Umawiaj spotkania z księgowym i informuj o terminach rozliczeń 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("ksiegowosc");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
