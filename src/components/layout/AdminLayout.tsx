"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode, type JSX } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import {
  IconHome, IconBuilding, IconUsers, IconChart, IconMessage,
  IconPhone, IconDollar, IconMail, IconShield, IconLock,
  IconSettings, IconBan, IconPhoneForward, IconUser, IconMessageSquare, IconStar,
} from "./icons";
import type { Business, Lead } from "@/types/database";
import type { Session } from "@supabase/supabase-js";

type AdminTab =
  | "dashboard" | "leads" | "businesses" | "witaline" | "messages"
  | "feedback" | "conversations" | "live-chat" | "voice"
  | "coupons" | "callbacks" | "sms" | "blocklist"
  | "security" | "costs" | "porty" | "webhooks" | "email" | "agents" | "verifications" | "support"
  // Deprecated but still handled in admin page (redirect to relevant tabs)
  | "statystyki" | "kalkulator" | "rodo" | "routing" | "numery" | "pricing";

interface AdminTabContextValue {
  tab: AdminTab;
  setTab: (t: AdminTab) => void;
  data: { businesses: Business[]; leads: Lead[] } | null;
  refresh: () => void;
}

const AdminTabContext = createContext<AdminTabContextValue>({
  tab: "dashboard",
  setTab: () => {},
  data: null,
  refresh: () => {},
});

export function useAdminTab() { return useContext(AdminTabContext); }

const sidebarItems = (leadCount: number) => [
  { key: "dashboard" as AdminTab, label: "Dashboard", icon: <IconHome className="w-5 h-5" /> },
  { key: "leads" as AdminTab, label: "Lead", icon: <IconUsers className="w-5 h-5" />, badge: leadCount || undefined },
  { key: "businesses" as AdminTab, label: "Firmy", icon: <IconBuilding className="w-5 h-5" /> },
  {
    key: "komunikacja" as AdminTab, label: "Komunikacja", icon: <IconMessage className="w-5 h-5" />,
    children: [
      { key: "messages" as AdminTab, label: "Wiadomości", icon: <IconMail className="w-4 h-4" /> },
      { key: "conversations" as AdminTab, label: "Rozmowy", icon: <IconMessageSquare className="w-4 h-4" /> },
      { key: "live-chat" as AdminTab, label: "Czaty na żywo", icon: <IconMessage className="w-4 h-4" /> },
      { key: "webhooks" as AdminTab, label: "Webhooki", icon: <IconMessageSquare className="w-4 h-4" /> },
      { key: "sms" as AdminTab, label: "SMS", icon: <IconMessage className="w-4 h-4" /> },
      { key: "feedback" as AdminTab, label: "Opinie", icon: <IconStar className="w-4 h-4" /> },
    ],
  },
  {
    key: "finanse" as AdminTab, label: "Finanse", icon: <IconChart className="w-5 h-5" />,
    children: [
      { key: "costs" as AdminTab, label: "Koszty/Zyski", icon: <IconDollar className="w-4 h-4" /> },
      { key: "witaline" as AdminTab, label: "WitaLine", icon: <IconStar className="w-4 h-4" /> },
      { key: "coupons" as AdminTab, label: "Kupony", icon: <IconDollar className="w-4 h-4" /> },
    ],
  },
  {
    key: "system" as AdminTab, label: "System", icon: <IconShield className="w-5 h-5" />,
    children: [
      { key: "security" as AdminTab, label: "Bezpieczeństwo", icon: <IconShield className="w-4 h-4" /> },
      { key: "blocklist" as AdminTab, label: "Blokady", icon: <IconBan className="w-4 h-4" /> },
      { key: "callbacks" as AdminTab, label: "Callbacki", icon: <IconPhone className="w-4 h-4" /> },
      { key: "porty" as AdminTab, label: "Porty", icon: <IconPhoneForward className="w-4 h-4" /> },
      { key: "email" as AdminTab, label: "Emails", icon: <IconMail className="w-4 h-4" /> },
      { key: "agents" as AdminTab, label: "Agenci support", icon: <IconUsers className="w-4 h-4" /> },
      { key: "verifications" as AdminTab, label: "Weryfikacje", icon: <IconLock className="w-4 h-4" /> },
      { key: "support" as AdminTab, label: "Panel support", icon: <IconMessageSquare className="w-4 h-4" />, href: "/support" },
    ],
  },
  { key: "voice" as AdminTab, label: "Voice", icon: <IconPhone className="w-5 h-5" /> },
];

export default function AdminLayoutShell({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const [data, setData] = useState<{ businesses: Business[]; leads: Lead[] } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const dashData = await res.json();
        setData({ businesses: dashData.businesses || [], leads: dashData.leads || [] });
        setSession((await supabase.auth.getSession()).data.session);
      } else if (res.status === 401) {
        setSession(null);
      }
    } catch { /* ignore */ }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (session === "loading") return (
    <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Sprawdzanie uprawnień...</p>
      </div>
    </div>
  );

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-50 flex items-center justify-center">
            <IconShield className="w-6 h-6 text-[#0d9488]" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-1">Brak dostępu</h2>
          <p className="text-sm text-zinc-400 mb-4">Zaloguj się, aby uzyskać dostęp do panelu administracyjnego.</p>
          <a href="/login" className="btn-primary text-sm px-5 py-2.5">Zaloguj się</a>
        </div>
      </div>
    );
  }

  const leadCount = data?.leads?.length || 0;
  const items = sidebarItems(leadCount);
  const userEmail = session.user?.email || "admin@witaline.pl";

  return (
    <AdminTabContext.Provider value={{ tab, setTab, data, refresh: fetchData }}>
      <div className="flex min-h-screen bg-[#FAFAF9]">
        <div className="hidden lg:block">
          <Sidebar items={items} activeKey={tab} onNavigate={(key) => setTab(key as AdminTab)} />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full animate-slide-in-right">
              <Sidebar items={items} activeKey={tab} onNavigate={(key) => { setTab(key as AdminTab); setMobileOpen(false); }} />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <TopNav
            title={tab.charAt(0).toUpperCase() + tab.slice(1)}
            onMenuToggle={() => setMobileOpen(!mobileOpen)}
            userEmail={userEmail}
            onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            notificationContext="admin"
          />
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AdminTabContext.Provider>
  );
}
