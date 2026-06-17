"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const HIDE_FOOTER_PATHS = ["/dashboard", "/admin", "/widget", "/reseller", "/login", "/register"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const shouldHide = HIDE_FOOTER_PATHS.some(p => pathname?.startsWith(p));
  if (shouldHide) return null;
  return <Footer />;
}
