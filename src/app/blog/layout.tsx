import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog i poradniki — Automatyczna Recepcja AI | WitaLine",
  description: "Praktyczna wiedza o automatyzacji obsługi telefonicznej. Poradniki, case studies i analizy o voicebotach AI, systemach IVR i recepcji AI.",
  openGraph: {
    title: "Blog i poradniki — WitaLine",
    description: "Praktyczna wiedza o automatyzacji obsługi telefonicznej.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
