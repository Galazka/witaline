import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla salonów optycznych | WitaLine",
  description: "Umawiaj wizyty u optyka i badania wzroku 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("optyk");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
