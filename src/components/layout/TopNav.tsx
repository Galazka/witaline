"use client";

import { type JSX } from "react";
import { IconMenu, IconUser, IconLogout } from "./icons";
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
}

export default function TopNav({ title, subtitle, onMenuToggle, userEmail, onLogout, actions, notificationContext, notificationBusinessId }: Props) {
  return (
    <header className="h-16 bg-[#0c1929] border-b border-white/5 sticky top-0 z-40">
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
          {actions}
          {notificationContext && (
            <NotificationDropdown context={notificationContext} businessId={notificationBusinessId} />
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
