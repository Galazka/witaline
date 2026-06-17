import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-zinc-400 border-t border-brand-900">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" inverted />
            <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
              Automatyczna recepcja AI dla Twojej firmy. Odbieramy 100% połączeń 24/7.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Produkt</p>
            <ul className="space-y-2 text-sm">
              <li><a href="/#wyprobuj" className="hover:text-brand-400 transition">Sprawdź bota</a></li>
              <li><a href="/#cennik" className="hover:text-brand-400 transition">Cennik</a></li>
              <li><a href="/#jak-dziala" className="hover:text-brand-400 transition">Jak działa</a></li>
              <li><a href="/#faq" className="hover:text-brand-400 transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Firma</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-brand-400 transition">Zarejestruj się</Link></li>
              <li><Link href="/login" className="hover:text-brand-400 transition">Logowanie</Link></li>
              <li><Link href="/regulamin" className="hover:text-brand-400 transition">Regulamin</Link></li>
              <li><Link href="/polityka-prywatnosci" className="hover:text-brand-400 transition">Prywatność</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Kontakt</p>
            <ul className="space-y-2 text-sm">
              <li className="text-zinc-500">+48 732 125 752</li>
              <li><a href="mailto:kontakt@witaline.pl" className="hover:text-brand-400 transition">kontakt@witaline.pl</a></li>
              <li className="text-zinc-500">Pon-Pt 9:00-17:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; {new Date().getFullYear()} WitaLine. Wszelkie prawa zastrzeżone.</p>
          <p>Hostowane w Europie · Zgodne z RODO</p>
        </div>
      </div>
    </footer>
  );
}
