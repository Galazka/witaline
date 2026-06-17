"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    fetch("/api/auth/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus("success");
          setBusinessId(data.businessId);
        } else {
          setStatus("error");
          setError(data.error || "Błąd");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Błąd połączenia");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <Logo size="sm" />

        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">Akceptowanie zaproszenia...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Zaproszenie zaakceptowane!</h1>
              <p className="text-sm text-zinc-500">Jesteś teraz członkiem zespołu. Możesz korzystać z panelu.</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-block bg-brand-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 transition"
            >
              Przejdź do panelu
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Błąd</h1>
              <p className="text-sm text-zinc-500">{error}</p>
            </div>
            <Link
              href="/register"
              className="inline-block bg-brand-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 transition"
            >
              Zarejestruj się
            </Link>
          </div>
        )}

        {status === "no-token" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Brak tokenu zaproszenia</h1>
              <p className="text-sm text-zinc-500">Użyj linku z zaproszenia wysłanego przez administratora.</p>
            </div>
            <Link
              href="/"
              className="inline-block bg-brand-400 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-500 transition"
            >
              Strona główna
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white px-4"><p className="text-sm text-zinc-500">Ładowanie...</p></div>}>
      <InviteContent />
    </Suspense>
  );
}
