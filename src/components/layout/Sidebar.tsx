"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  const toggleSubmenu = (key: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isActive = (item: SidebarItem) =>
    activeKey === item.key || (item.children?.some(c => c.key === activeKey));

  const NavItem = ({ item, depth = 0 }: { item: SidebarItem; depth?: number }) => {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const open = expandedMenus.has(item.key);

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.key)}
            className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-brand-50/80 text-brand-700"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-full" />
            )}
            <span className="w-5 h-5 shrink-0 text-current">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                <IconChevronDown className={`w-4 h-4 shrink-0 text-zinc-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
          {!collapsed && open && item.children && (
            <div className="ml-3 mt-0.5 pl-4 border-l border-zinc-100 space-y-0.5">
              {item.children.map((child) => (
                <NavItem key={child.key} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          if (item.href) {
            router.push(item.href);
          } else {
            onNavigate(item.key);
          }
        }}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-brand-50/80 text-brand-700 shadow-sm"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }`}
        title={collapsed ? item.label : undefined}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-full" />
        )}
        <span className="w-5 h-5 shrink-0 text-current">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full shrink-0">
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white/90 backdrop-blur-lg border-r border-zinc-200/60 z-50 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-zinc-100/60">
        {logo || (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-sm shadow-brand-200/40 shrink-0">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            {!collapsed && (
              <span className="text-base font-bold text-zinc-800 font-display tracking-tight">WitaLine</span>
            )}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-300 hidden lg:block transition-colors"
        >
          {collapsed ? <IconChevronLeft className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4 rotate-90" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 scrollbar-thin">
        {items.map((item) => (
          <NavItem key={item.key} item={item} />
        ))}
      </nav>

      {bottomContent && (
        <div className="border-t border-zinc-100/60 p-3">
          {bottomContent}
        </div>
      )}
    </aside>
  );
}
