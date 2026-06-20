"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode, type JSX } from "react";
import { createClient } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import {
  IconHome, IconChart, IconPhone, IconCalendar, IconMessage,
  IconDollar, IconUser, IconShield, IconSettings, IconUsers, IconStar, IconCheck,
} from "./icons";
import type { Session } from "@supabase/supabase-js";
import type { StaffRole, Permission } from "@/types/database";
import { ROLE_PERMISSIONS } from "@/types/database";

export type DashboardTab =
  | "overview" | "chats" | "calls" | "costs" | "reservations" | "sms"
  | "leads" | "config" | "upgrade" | "security" | "account" | "voice" | "billing";

interface DashboardTabContextValue {
  tab: DashboardTab;
  setTab: (t: DashboardTab) => void;
}

interface PermContextValue {
  role: StaffRole | null;
  isOwner: boolean;
  isSuperAdmin: boolean;
  hasPerm: (perm: Permission) => boolean;
  setPerms: (role: StaffRole | null, isOwner: boolean, isSuperAdmin: boolean, perms: string[]) => void;
}

const DashboardTabContext = createContext<DashboardTabContextValue>({
  tab: "overview",
  setTab: () => {},
});

const defaultPerms: PermContextValue = {
  role: null, isOwner: false, isSuperAdmin: false,
  hasPerm: () => false, setPerms: () => {},
};

export const DashboardPermContext = createContext<PermContextValue>(defaultPerms);

export function useDashboardTab() { return useContext(DashboardTabContext); }
export function useDashboardPerms() { return useContext(DashboardPermContext); }

const sidebarItems: { key: DashboardTab; label: string; icon: JSX.Element }[] = [
  { key: "overview", label: "Przegląd", icon: <IconHome className="w-5 h-5" /> },
  { key: "chats", label: "Czaty", icon: <IconMessage className="w-5 h-5" /> },
  { key: "calls", label: "Połączenia", icon: <IconPhone className="w-5 h-5" /> },
  { key: "costs", label: "Koszty", icon: <IconChart className="w-5 h-5" /> },
  { key: "reservations", label: "Rezerwacje", icon: <IconCalendar className="w-5 h-5" /> },
  { key: "sms", label: "SMS/WhatsApp", icon: <IconMessage className="w-5 h-5" /> },
  { key: "leads", label: "Leady", icon: <IconUsers className="w-5 h-5" /> },
  { key: "config", label: "Konfiguracja", icon: <IconSettings className="w-5 h-5" /> },
  { key: "voice", label: "Voice", icon: <IconStar className="w-5 h-5" /> },
  { key: "billing", label: "Płatności", icon: <IconDollar className="w-5 h-5" /> },
  { key: "upgrade", label: "Plan", icon: <IconDollar className="w-5 h-5" /> },
  { key: "security", label: "Bezpieczeństwo", icon: <IconShield className="w-5 h-5" /> },
  { key: "account", label: "Konto", icon: <IconUser className="w-5 h-5" /> },
];

// Tabs per role: admin sees all; others see filtered set
const ROLE_VISIBLE_TABS: Record<string, DashboardTab[]> = {
  admin: ["overview", "chats", "calls", "costs", "reservations", "sms", "leads", "config", "voice", "billing", "upgrade", "security", "account"],
  manager: ["overview", "chats", "calls", "costs", "reservations", "sms", "leads", "billing", "upgrade", "account"],
  receptionist: ["overview", "chats", "calls", "reservations", "costs", "account"],
  viewer: ["overview", "calls", "reservations", "costs", "account"],
};

export default function DashboardLayoutShell({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [explicitPerms, setExplicitPerms] = useState<string[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });
  }, [supabase]);

  const permCtx = useMemo(() => ({
    role, isOwner, isSuperAdmin,
    hasPerm: (perm: Permission) => {
      if (isOwner || isSuperAdmin) return true;
      if (!role) return false;
      const rolePerms = (ROLE_PERMISSIONS[role] as string[]) || [];
      return [...rolePerms, ...explicitPerms].includes(perm);
    },
    setPerms: (r: StaffRole | null, owner: boolean, sa: boolean, perms: string[]) => {
      setRole(r); setIsOwner(owner); setIsSuperAdmin(sa); setExplicitPerms(perms);
    },
  }), [role, isOwner, isSuperAdmin, explicitPerms]);

  const effectiveRole = role || (isOwner ? "admin" : null);
  const visibleTabs = effectiveRole ? ROLE_VISIBLE_TABS[effectiveRole] || sidebarItems.map(i => i.key) : sidebarItems.map(i => i.key);
  const filteredSidebar = sidebarItems.filter(i => visibleTabs.includes(i.key));

  // Redirect if current tab is not visible
  if (effectiveRole && tab !== "overview" && !visibleTabs.includes(tab)) {
    setTab("overview");
  }

  if (session === "loading") return <div className="flex-1 flex items-center justify-center"><p className="text-zinc-400">Sprawdzanie uprawnień...</p></div>;
  if (!session) return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
        <h1 className="text-2xl font-bold text-zinc-900">Wymagane logowanie</h1>
        <p className="text-sm text-zinc-500">Zaloguj się aby uzyskać dostęp do panelu</p>
        <a href="/login" className="inline-block bg-brand-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-500 transition">Przejdź do logowania</a>
      </div>
    </div>
  );

  const userEmail = session.user?.email || "user@witaline.pl";

  return (
    <DashboardPermContext.Provider value={permCtx}>
    <DashboardTabContext.Provider value={{ tab, setTab }}>
      <div className="flex min-h-screen bg-zinc-50">
        <div className="hidden lg:block">
          <Sidebar items={filteredSidebar} activeKey={tab} onNavigate={(key) => setTab(key as DashboardTab)} />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full">
              <Sidebar items={filteredSidebar} activeKey={tab} onNavigate={(key) => { setTab(key as DashboardTab); setMobileOpen(false); }} />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <TopNav
            title="Dashboard"
            onMenuToggle={() => setMobileOpen(!mobileOpen)}
            userEmail={userEmail}
            onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            notificationContext="dashboard"
          />
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </DashboardTabContext.Provider>
    </DashboardPermContext.Provider>
  );
}
