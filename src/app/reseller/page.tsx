"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const plPL = {
  variables: {
    sign_in: {
      email_label: "Adres email",
      password_label: "Hasło",
      button_label: "Zaloguj się",
      loading_button_label: "Logowanie...",
      link_text: "Masz już konto? Zaloguj się",
    },
    sign_up: {
      email_label: "Adres email",
      password_label: "Hasło",
      button_label: "Zarejestruj się",
      loading_button_label: "Rejestracja...",
      link_text: "Nie masz konta? Zarejestruj się",
      confirmation_text: "Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację",
    },
    forgotten_password: {
      email_label: "Adres email",
      button_label: "Wyślij link do resetowania",
      loading_button_label: "Wysyłanie...",
      link_text: "Zapomniałeś hasła?",
      confirmation_text: "Sprawdź swoją skrzynkę email, aby zresetować hasło",
    },
  },
};

interface ResellerClient {
  id: string;
  name: string;
  current_plan: string;
  subscription_status: string;
  suspended: boolean;
  minutes_used_this_week: number;
  created_at: string;
  owner_uid: string;
  reseller_markup: number;
}

const planLabels: Record<string, string> = {
  start_100: "Start",
  pro_500: "Pro",
  enterprise_2000: "Enterprise",
};

const statusColors: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-700",
  active: "bg-brand-100 text-brand-400",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-600",
  incomplete: "bg-brand-50 text-zinc-500",
};

export default function ResellerPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [clients, setClients] = useState<ResellerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s);
      if (s) fetchClients();
      else setLoading(false);
    });
  }, []);

  async function fetchClients() {
    const res = await fetch("/api/reseller/clients");
    const data = await res.json();
    if (Array.isArray(data)) setClients(data);
    setLoading(false);
  }

  if (session === null) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-zinc-400">Ładowanie...</p></div>;
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center text-zinc-900 mb-6">Panel partnera</h1>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} localization={plPL} providers={[]} theme="light" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white">
      <nav className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-400">Panel partnera</span>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-zinc-500 hover:text-zinc-700 transition">
            Wyloguj
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Moi klienci</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-400">Klienci</p>
            <p className="text-2xl font-bold text-brand-400">{clients.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-400">Aktywnych</p>
            <p className="text-2xl font-bold text-brand-400">
              {clients.filter((c) => c.subscription_status === "active" || c.subscription_status === "trialing").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-400">Start</p>
            <p className="text-2xl font-bold text-zinc-900">
              {clients.filter((c) => c.current_plan === "start_100").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs text-zinc-400">Pro/Enterprise</p>
            <p className="text-2xl font-bold text-zinc-900">
              {clients.filter((c) => c.current_plan !== "start_100").length}
            </p>
          </div>
        </div>

        {/* Clients table */}
        {loading ? (
          <p className="text-sm text-zinc-400">Ładowanie...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
            Brak klientów. Zapraszaj firmy do rejestracji przez Twój link partnerski.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Firma</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Minuty</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Marża</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Od</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-brand-50 transition">
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{planLabels[c.current_plan] || c.current_plan}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.subscription_status] || "bg-brand-50 text-zinc-600"}`}>
                        {c.subscription_status === "trialing" ? "Test" :
                         c.subscription_status === "active" ? "Aktywny" :
                         c.subscription_status === "past_due" ? "Zaległy" :
                         c.subscription_status === "canceled" ? "Anulowany" : c.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{c.minutes_used_this_week}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.reseller_markup}%</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString("pl-PL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-2">Twój link partnerski</h3>
          <p className="text-xs text-zinc-500 mb-3">
            Udostępnij ten link firmom, aby rejestrowały się jako Twoi klienci.
            Zyskujesz prowizję od każdej płatności.
          </p>
          <code className="block bg-brand-950 text-zinc-100 text-xs rounded-lg p-3">
            {typeof window !== "undefined"
              ? `${window.location.origin}/register?ref=partner`
              : "/register?ref=partner"}
          </code>
        </div>
      </div>
    </div>
  );
}




