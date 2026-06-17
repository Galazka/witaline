import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Inter_Tight } from "next/font/google";
import ConditionalFooter from "@/components/ConditionalFooter";
import { ToastProvider } from "@/components/ToastNotifications";
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
  title: "WitaLine — Automatyczna Recepcja 24/7 dla Firm",
  description:
    "System Gwarantowanego Odbierania Klientów. Asystent głosowy odbiera zamówienia i umawia wizyty 24/7. Oszczędzasz 4000+ PLN miesięcznie.",
  keywords: ["recepcja", "asystent głosowy", "automatyczna recepcja", "bot telefoniczny", "WitaLine"],
  openGraph: {
    title: "WitaLine — Automatyczna Recepcja 24/7",
    description: "Odbieramy każdy telefon. Asystent pracuje 24/7. 30-dniowa gwarancja zwrotu.",
    type: "website",
    locale: "pl_PL",
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
        <ToastProvider>
          {children}
        </ToastProvider>
        <ConditionalFooter />
      </body>
    </html>
  );
}




