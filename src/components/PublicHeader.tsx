"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV_LINKS = [
  { href: "/#jak-dziala", label: "Jak działa" },
  { href: "/#technologia", label: "Technologia" },
  { href: "/#case-studies", label: "Wdrożenia" },
  { href: "/#cennik", label: "Cennik" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/#kontakt", label: "Kontakt" },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Logo size="sm" withTagline={false} />
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-500 hover:text-brand-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm text-zinc-600 hover:text-brand-500 transition-colors font-medium px-3 py-2"
          >
            Zaloguj
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            7 dni za darmo
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-zinc-600"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-zinc-600 font-medium py-1.5"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-zinc-600 font-medium py-1.5 sm:hidden">
            Zaloguj
          </Link>
        </div>
      )}
    </nav>
  );
}
