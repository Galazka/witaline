import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla agentów ubezpieczeniowych | WitaLine",
  description: "Umawiaj spotkania z agentem i wyceniaj polisy 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("ubezpieczenia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
