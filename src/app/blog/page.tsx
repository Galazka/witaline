import Link from "next/link";
import { blogPosts } from "@/lib/blog";
import PublicHeader from "@/components/PublicHeader";
import FloatingWidget from "@/components/FloatingWidget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — WitaLine",
  description: "Artykuły o automatyzacji obsługi telefonicznej, voicebotach, syntezie mowy i efektywności biznesowej.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <PublicHeader />

      <div className="max-w-6xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">Blog</h1>
        <p className="text-zinc-500 text-lg mb-16 max-w-2xl">
          Praktyczna wiedza o automatyzacji obsługi telefonicznej — bez marketingowego bełkotu.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[8/5] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-brand-700 bg-brand-100 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-500 mb-4 flex-1 leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-4 border-t border-zinc-100">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {post.readTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-brand-100 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Chcesz być na bieżąco?</h2>
          <p className="text-zinc-600 mb-6 max-w-md mx-auto">
            Nowe artykuły co tydzień. Zero spamu, tylko praktyczna wiedza o automatyzacji.
          </p>
          <div className="flex max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="Twój e-mail"
              className="flex-1 px-5 py-3 rounded-2xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold text-sm select-none cursor-not-allowed opacity-80">
              Zapisz się
            </span>
          </div>
        </div>
      </div>

      <FloatingWidget />
    </main>
  );
}
