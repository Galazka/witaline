import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla agencji marketingowych | WitaLine",
  description: "Przyjmuj zapytania ofertowe i umawiaj spotkania z klientami 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("marketing");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
