"use client";

import { type JSX } from "react";
import { IconMenu, IconSearch, IconUser, IconLogout } from "./icons";
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
    <header className="h-16 bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuToggle && (
            <button onClick={onMenuToggle} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-zinc-100 text-zinc-500">
              <IconMenu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-zinc-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-zinc-400 truncate -mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {notificationContext && (
            <NotificationDropdown context={notificationContext} businessId={notificationBusinessId} />
          )}
          {userEmail && onLogout && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                <IconUser className="w-4 h-4 text-brand-600" />
              </div>
              <div className="hidden md:block text-xs">
                <p className="font-medium text-zinc-700 truncate max-w-[120px]">{userEmail}</p>
              </div>
              <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500" title="Wyloguj">
                <IconLogout className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
