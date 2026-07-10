"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function LoginPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function redirectAfterLogin(uid: string, userEmail?: string) {
    try {
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      if (data.isAdmin) {
        router.replace("/admin");
        return;
      }
    } catch {}
    router.replace("/dashboard");
  }

useEffect(() => {
  const timeout = setTimeout(() => {
    if (session === null) setSession(false);
  }, 3000);
  supabase.auth.getSession().then(({ data: { session: s } }) => {
    setSession(!!s);
    clearTimeout(timeout);
  }).catch(() => {
    clearTimeout(timeout);
    if (session === null) setSession(false);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
    setSession(!!sess);
  });
  return () => { subscription.unsubscribe(); clearTimeout(timeout); };
}, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message === "Invalid login credentials" ? "Nieprawidłowy email lub hasło." : err.message); }
      else if (data.session) { redirectAfterLogin(data.session.user.id, data.session.user.email); }
    } catch { setError("Wystąpił błąd. Spróbuj ponownie."); }
    finally { setLoading(false); }
  }

  if (session === null) return <div className="flex-1 flex items-center justify-center"><p className="text-zinc-400">Ładowanie...</p></div>;

  if (session && !sessionTimeout) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 px-4">
        <div className="glass-card-dark p-6 md:p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-white text-sm">Jesteś już zalogowany.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.replace("/dashboard")} className="px-4 py-2 text-sm font-medium text-white bg-[#0d9488] rounded-xl hover:bg-[#0f766e] transition-all">Przejdź do panelu</button>
            <button onClick={async () => { await supabase.auth.signOut(); setSession(false); }} className="px-4 py-2 text-sm font-medium text-white/70 border border-white/20 rounded-xl hover:bg-white/5 transition-all">Wyloguj się</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-400/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/"><Logo size="lg" /></Link>
        </div>

<div className="glass-card-dark p-6 md:p-8">
  <div className="text-center mb-8">
    <h1 className="text-2xl font-bold text-white font-display">Witaj ponownie</h1>
    <p className="text-sm text-white/50 mt-2">Zaloguj się do panelu WitaLine</p>
  </div>
  <form onSubmit={handleLogin} className="space-y-5">
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.pl" required className="input-dark w-full" />
    </div>
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1.5">Hasło</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="input-dark w-full" />
    </div>
    {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>}
    <button type="submit" disabled={loading} className="btn-primary w-full">
      {loading ? "Logowanie..." : "Zaloguj się"}
    </button>
  </form>
</div>

        <p className="text-center text-sm text-white/60">
          Nie masz konta?{" "}
          <Link href="/register" className="text-brand-300 hover:text-brand-200 font-semibold transition-colors">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
}
