"use client";

import { useState, useEffect, type JSX } from "react";
import { IconMenu, IconUser, IconLogout, IconSun, IconMoon, IconMessage, IconAlertTriangle } from "./icons";
import NotificationDropdown from "@/components/NotificationDropdown";

interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  userEmail?: string;
  onLogout?: () => void;
  actions?: JSX.Element;
  notificationContext?: "admin" | "dashboard";
  notificationBusinessId?: string;
  chatUnreadCount?: number;
  onChatClick?: () => void;
}

interface ProviderAlert {
  provider: "elevenlabs" | "twilio";
  level: "low" | "critical";
}

export default function TopNav({ title, subtitle, onMenuToggle, userEmail, onLogout, actions, notificationContext, notificationBusinessId, chatUnreadCount, onChatClick }: Props) {
  const [darkMode, setDarkMode] = useState(false);
  const [providerAlerts, setProviderAlerts] = useState<ProviderAlert[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/admin/provider-balances");
        if (res.ok) {
          const data = await res.json();
          const alerts: ProviderAlert[] = [];
          if (data.elevenLabs?.alertLevel !== "none") {
            alerts.push({ provider: "elevenlabs", level: data.elevenLabs.alertLevel });
          }
          if (data.twilio?.alertLevel !== "none") {
            alerts.push({ provider: "twilio", level: data.twilio.alertLevel });
          }
          setProviderAlerts(alerts);
        }
      } catch {
        // ignore
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[4.5rem] bg-[#0c1929] border-b border-white/5 sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuToggle && (
            <button onClick={onMenuToggle} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/40 transition-colors">
              <IconMenu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-white/90 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-white/40 truncate -mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {providerAlerts.length > 0 && (
            <button
              className="relative p-2 rounded-xl hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 transition-colors"
              aria-label="Alerty dostawców"
              title="Alerty dostawców"
            >
              <IconAlertTriangle className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full" />
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
            aria-label={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}
          >
            {darkMode ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
          </button>
          {actions}
          {notificationContext && (
            <NotificationDropdown context={notificationContext} businessId={notificationBusinessId} />
          )}
          {typeof chatUnreadCount !== 'undefined' && (
            <button
              onClick={onChatClick}
              className="relative p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Czaty"
            >
              <IconMessage className="w-5 h-5" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </button>
          )}
          {userEmail && onLogout && (
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 bg-[#0d9488] rounded-full flex items-center justify-center ring-2 ring-[#0c1929]">
                <IconUser className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-xs leading-tight">
                <p className="font-medium text-white/60 truncate max-w-[120px]">{userEmail}</p>
              </div>
              <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Wyloguj">
                <IconLogout className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
