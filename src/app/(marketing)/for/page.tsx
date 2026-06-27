import { Metadata } from "next";
import Link from "next/link";
import { getAllIndustryConfigs } from "@/components/IndustryLandingPage";

export const metadata: Metadata = {
  title: "Automatyczna recepcja AI dla Twojej branży | WitaLine",
  description: "Sprawdź, jak WitaLine automatyzuje obsługę telefoniczną w Twojej branży. Restauracje, beauty, medycyna, prawo, hotele i więcej.",
};

export default function ForPage() {
  const industries = getAllIndustryConfigs();
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
<Link href="/" className="text-xl font-bold text-[#0d9488]">WitaLine</Link>
          <Link href="/register" className="bg-[#0d9488] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#0f766e] transition-colors">
             Wypróbuj za darmo
           </Link>
        </div>
      </nav>
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-zinc-900 text-center mb-4">Automatyczna recepcja AI</h1>
          <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Wybierz swoją branżę i sprawdź, jak WitaLine może pomóc Twojej firmie.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                href={`/for/${ind.slug}`}
                className="block p-6 rounded-2xl border border-zinc-100 hover:border-green-200 hover:shadow-lg transition-all bg-white"
              >
                <div className="text-3xl mb-3">{ind.features[0]?.icon || "🚀"}</div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-2">{ind.name}</h2>
                <p className="text-sm text-zinc-500 line-clamp-2">{ind.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
