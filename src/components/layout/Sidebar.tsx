"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSX, useState, useEffect } from "react";
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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ items, activeKey, onNavigate, logo, bottomContent, mobileOpen, onMobileClose }: Props) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Auto-expand parent menu if activeKey is a child
  useEffect(() => {
    const newExpanded = new Set(expandedMenus);
    items.forEach(item => {
      if (item.children?.some(c => c.key === activeKey)) {
        newExpanded.add(item.key);
      }
    });
    if (newExpanded.size !== expandedMenus.size) {
      setExpandedMenus(newExpanded);
    }
  }, [activeKey, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // When mobileOpen prop is provided, use it (true = open, false = closed)
  const collapsed = mobileOpen !== undefined ? !mobileOpen : internalCollapsed;

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
                ? "bg-[#0d9488]/10 text-[#14b8a6]"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#0d9488] rounded-full" />
            )}
            <span className="w-5 h-5 shrink-0 text-current">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                <IconChevronDown className={`w-4 h-4 shrink-0 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
          {!collapsed && open && item.children && (
            <div className="ml-3 mt-0.5 pl-4 border-l border-white/10 space-y-0.5">
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
            ? "bg-[#0d9488]/10 text-[#14b8a6]"
            : "text-white/50 hover:bg-white/5 hover:text-white/80"
        }`}
        title={collapsed ? item.label : undefined}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#0d9488] rounded-full" />
        )}
        <span className="w-5 h-5 shrink-0 text-current">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] font-semibold bg-[#0d9488]/20 text-[#14b8a6] px-1.5 py-0.5 rounded-full shrink-0">
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay when sidebar open */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#0c1929] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ${
          collapsed ? "-translate-x-full lg:w-16 lg:translate-x-0" : "w-64 lg:w-64"
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          {logo || (
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0d9488] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              {!collapsed && (
                <span className="text-base font-bold text-white/90 font-display tracking-tight">WitaLine</span>
              )}
            </Link>
          )}
          <button
            onClick={() => {
              if (mobileOpen !== undefined) {
                onMobileClose?.();
              } else {
                setInternalCollapsed(!internalCollapsed);
              }
            }}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-white/30 hidden lg:block transition-colors"
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
          <div className="border-t border-white/5 p-3">
            {bottomContent}
          </div>
        )}
      </aside>
    </>
  );
}