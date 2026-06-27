"use client";

import { useEffect, useState } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Błąd panelu</h2>
        <p className="text-sm text-zinc-500 mb-2">Nie udało się załadować dashboardu.</p>
        <p className="text-xs text-zinc-400 mb-6">Spróbuj odświeżyć stronę. Jeśli problem będzie się powtarzał, skontaktuj się z supportem.</p>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full px-5 py-2.5 rounded-xl bg-[#0d9488] text-white text-sm font-semibold hover:bg-[#0d3d3a] transition-colors shadow-sm"
          >
            Spróbuj ponownie
          </button>
          <a
            href="/dashboard"
            className="w-full px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-[#0d9488]/20 hover:text-[#0f766e] transition-colors"
          >
            Odśwież stronę
          </a>
        </div>

        <button
          onClick={() => setShowDetail(!showDetail)}
          className="mt-6 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {showDetail ? "Schowaj szczegóły" : "Pokaż szczegóły błędu"}
        </button>
        {showDetail && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-left">
            <p className="text-xs font-mono text-red-700 break-all">{error.message || "Nieznany błąd"}</p>
            {error.digest && (
              <p className="text-[10px] text-red-500 mt-1 font-mono">ID: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
