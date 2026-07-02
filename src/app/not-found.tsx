import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-brand-600">?</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Strona nie znaleziona</h1>
        <p className="text-zinc-500 mb-6 text-sm">Ta strona nie istnieje lub została przeniesiona.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Strona główna
        </Link>
      </div>
    </div>
  );
}
