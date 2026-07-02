import { Metadata } from "next";
import IndustryLandingPage, { getIndustryConfig } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla biur podróży | WitaLine",
  description: "Rezerwuj wycieczki i wakacje 24/7. Asystent AI WitaLine pomaga w wyborze i przyjmuje rezerwacje.",
};

export default function Page() {
  const config = getIndustryConfig("turystyka");
  if (!config) return null;
  return <IndustryLandingPage industry={config} />;
}
