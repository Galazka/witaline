"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type JSX, useState } from "react";
import { IconChevronDown, IconChevronLeft } from "./icons";

export interface SidebarItem {
  key: string;
  label: string;
  icon: JSX.Element;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
}

interface Props {
  items: SidebarItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  logo?: JSX.Element;
  bottomContent?: JSX.Element;
}

export default function Sidebar({ items, activeKey, onNavigate, logo, bottomContent }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isActive = (item: SidebarItem) =>
    activeKey === item.key || (item.children?.some(c => c.key === activeKey));

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-zinc-200 z-50 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-100">
        {logo || (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-zinc-900 font-display tracking-tight">WitaLine</span>
            )}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hidden lg:block"
        >
          {collapsed ? <IconChevronLeft className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4 rotate-90" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {items.map((item) => {
          const active = isActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const open = expandedMenus.has(item.key);

          if (hasChildren) {
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleSubmenu(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span className="w-5 h-5 shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <IconChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </>
                  )}
                </button>
                {!collapsed && open && item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.key}
                        onClick={() => onNavigate(child.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeKey === child.key
                            ? "bg-brand-50 text-brand-700 font-medium"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="w-4 h-4 shrink-0">{child.icon}</span>
                        <span className="truncate">{child.label}</span>
                        {child.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                            {child.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="w-5 h-5 shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom content (user avatar, etc.) */}
      {bottomContent && (
        <div className="border-t border-zinc-100 p-3">
          {bottomContent}
        </div>
      )}
    </aside>
  );
}
