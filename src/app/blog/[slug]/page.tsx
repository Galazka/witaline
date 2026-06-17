import Link from "next/link";
import { blogPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import FloatingWidget from "@/components/FloatingWidget";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: `${post.title} — WitaLine Blog`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <main className="min-h-screen bg-zinc-50">
      <PublicHeader />
      <article className="max-w-3xl mx-auto px-6 py-24">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <Link href="/blog" className="hover:text-brand-600 transition">Blog</Link>
          <span>→</span>
          <span className="text-zinc-600">{post.title.slice(0, 40)}…</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-4xl font-bold text-zinc-900 mb-4 leading-tight">{post.title}</h1>
        <p className="text-lg text-zinc-500 mb-6">{post.excerpt}</p>

        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-10 pb-10 border-b border-zinc-200">
          <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center font-semibold text-brand-700 text-sm">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="text-zinc-800 font-medium">{post.author}</p>
            <p className="text-xs">{post.authorRole} · {post.date} · {post.readTime}</p>
          </div>
        </div>

        <img
          src={post.image}
          alt={post.imageAlt}
          className="w-full rounded-3xl mb-12 shadow-md"
        />

        <div className="prose prose-zinc prose-lg max-w-none
          prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-6
          prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-3
          prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:mb-5
          prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-zinc-800
          prose-ul:text-zinc-600
          prose-li:marker:text-brand-400
          prose-table:text-sm
          prose-th:bg-zinc-100 prose-th:px-4 prose-th:py-2 prose-th:text-left
          prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-zinc-100
          [&_:is(table)]:w-full [&_:is(table)]:border-collapse [&_:is(table)]:my-8 [&_:is(table)]:rounded-2xl [&_:is(table)]:overflow-hidden [&_:is(table)]:shadow-sm
        ">
          {post.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i}>{line.replace("## ", "")}</h2>;
            }
            if (line.startsWith("### ")) {
              return <h3 key={i}>{line.replace("### ", "")}</h3>;
            }
            if (line.startsWith("---")) {
              return <hr key={i} className="my-10 border-zinc-200" />;
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return <p key={i} className="font-semibold text-zinc-800 text-lg">{line.replace(/\*\*/g, "")}</p>;
            }
            if (line.startsWith("| ")) {
              return null;
            }
            if (line === "") {
              return <div key={i} className="h-4" />;
            }
            const liMatch = line.match(/^- (.+)/);
            if (liMatch) {
              return <li key={i} className="text-zinc-600 ml-6 list-disc">{liMatch[1]}</li>;
            }
            const boldMatch = line.match(/^\*\*(.+?)\*\*/);
            if (boldMatch) {
              return <p key={i} className="text-zinc-600"><strong className="text-zinc-800">{boldMatch[1]}</strong>{line.replace(/^\*\*.+?\*\*/, "")}</p>;
            }
            const linkMatch = line.match(/\[(.+?)\]\((.+?)\)/);
            if (linkMatch) {
              const parts = line.split(/\[.+?\]\(.+?\)/);
              return <p key={i} className="text-zinc-600">{parts[0]}<a href={linkMatch[2]} className="text-brand-600">{linkMatch[1]}</a>{parts[1]}</p>;
            }
            return <p key={i} className="text-zinc-600">{line}</p>;
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-brand-200 flex items-center justify-center font-bold text-brand-700 text-lg">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-zinc-800">{post.author}</p>
              <p className="text-sm text-zinc-500">{post.authorRole}</p>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8">Przeczytaj też</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-xl transition-all duration-300 flex"
              >
                <div className="w-48 shrink-0 overflow-hidden">
                  <img src={r.image} alt={r.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-brand-600 transition-colors leading-snug">{r.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{r.excerpt}</p>
                  </div>
                  <p className="text-xs text-zinc-400 mt-3">{r.date} · {r.readTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-100 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Spodobał Ci się artykuł?</h2>
          <p className="text-zinc-600 mb-6">
            Dowiedz się, jak WitaLine może pomóc Twojej firmie zaoszczędzić 60% kosztów obsługi telefonicznej.
          </p>
          <Link
            href="/oferta-indywidualna"
            className="inline-block px-8 py-3 bg-brand-600 text-white rounded-2xl font-semibold text-sm hover:bg-brand-500 transition"
          >
            Porozmawiajmy o Twojej firmie
          </Link>
        </div>
      </section>

      <FloatingWidget />
    </main>
  );
}
