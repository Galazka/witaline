import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla fotografów | WitaLine",
  description: "Umawiaj sesje fotograficzne i przyjmuj zlecenia filmowe 24/7.",
};

export default function Page() {
  const config = getIndustryConfig("fotografia");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
