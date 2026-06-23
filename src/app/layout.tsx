import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Inter_Tight } from "next/font/google";
import ConditionalFooter from "@/components/ConditionalFooter";
import { ToastProvider } from "@/components/ToastNotifications";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WitaLine — Automatyczna Recepcja AI 24/7 dla Firm",
    template: "%s — WitaLine",
  },
  description:
    "Automatyczna recepcja AI: asystent głosowy odbiera połączenia, przyjmuje zamówienia, umawia wizyty i odpowiada na pytania 24/7. Konfiguracja w 15 minut. Oszczędzasz 4000+ PLN miesięcznie.",
  keywords: [
    "automatyczna recepcja", "asystent głosowy AI", "bot telefoniczny", "wirtualna recepcjonistka",
    "IVR", "call center AI", "automatyzacja obsługi klienta", "system telefoniczny",
    "sztuczna inteligencja rozmowy", "WitaLine", "odbieranie połączeń 24/7",
    "rezerwacje online", "zamówienia telefoniczne", "lead generation",
  ],
  metadataBase: new URL("https://witaline.pl"),
  alternates: {
    canonical: "https://witaline.pl",
  },
  openGraph: {
    title: "WitaLine — Automatyczna Recepcja AI 24/7",
    description:
      "System Gwarantowanego Odbierania Klientów. Asystent głosowy AI odbiera zamówienia i umawia wizyty 24/7. Oszczędzasz 4000+ PLN miesięcznie.",
    type: "website",
    locale: "pl_PL",
    siteName: "WitaLine",
    url: "https://witaline.pl",
  },
  twitter: {
    card: "summary_large_image",
    title: "WitaLine — Automatyczna Recepcja AI 24/7",
    description: "Asystent głosowy AI odbiera połączenia 24/7. Konfiguracja w 15 minut.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-foreground" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <JsonLd />
        <ToastProvider>
          {children}
        </ToastProvider>
        <ConditionalFooter />
      </body>
    </html>
  );
}




