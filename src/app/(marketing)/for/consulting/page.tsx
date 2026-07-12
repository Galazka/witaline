import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla firm doradczych | WitaLine",
  description: "Umawiaj spotkania doradcze i zbieraj leady 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("consulting");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
