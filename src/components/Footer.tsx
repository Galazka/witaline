import Link from "next/link";
import Logo from "@/components/Logo";
import { WITALINE_CONTACT_EMAIL, WITALINE_PHONE_NUMBER, WITALINE_PHONE_DISPLAY } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative bg-zinc-900 text-zinc-400 border-t border-zinc-800/50 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0d9488]/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0d9488]/2 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" inverted />
            <p className="text-sm text-zinc-500 mt-3 leading-relaxed max-w-[220px]">
              Automatyczna recepcja AI dla Twojej firmy. Odbieramy 100% połączeń 24/7.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                5.0 — 15k+ rozmów
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Produkt</p>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/#jak-dziala" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Jak działa</a></li>
              <li><a href="/#technologia" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Technologia</a></li>
              <li><a href="/#cennik" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Cennik</a></li>
              <li><a href="/#faq" className="text-zinc-400 hover:text-[#0d9488] transition-colors">FAQ</a></li>
              <li><Link href="/oferta-indywidualna" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Oferta Enterprise</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Firma</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/register" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Rejestracja</Link></li>
              <li><Link href="/login" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Logowanie</Link></li>
              <li><Link href="/blog" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Blog</Link></li>
              <li><Link href="/regulamin" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Regulamin</Link></li>
              <li><Link href="/polityka-prywatnosci" className="text-zinc-400 hover:text-[#0d9488] transition-colors">Prywatność</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Kontakt</p>
            <ul className="space-y-2.5 text-sm">
              <li><a href={`tel:${WITALINE_PHONE_NUMBER}`} className="text-zinc-300 hover:text-[#0d9488] transition-colors font-medium">{WITALINE_PHONE_DISPLAY}</a></li>
              <li><a href={`mailto:${WITALINE_CONTACT_EMAIL}`} className="text-zinc-400 hover:text-[#0d9488] transition-colors">{WITALINE_CONTACT_EMAIL}</a></li>
              <li className="text-zinc-500 text-xs">Pon-Pt 9:00-17:00</li>
              <li className="mt-3">
                <a href="#kontakt" className="inline-flex items-center gap-1.5 text-xs text-[#0d9488] hover:text-[#0d9488] transition-colors font-medium">
                  Napisz do nas
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mt-12 mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} WitaLine. Wszelkie prawa zastrzeżone.</p>
          <p className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#0d9488]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Hostowane w UE
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#0d9488]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Zgodne z RODO
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
