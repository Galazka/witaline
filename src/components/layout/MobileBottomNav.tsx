"use client";

import { useRouter, usePathname } from "next/navigation";
import { IconHome, IconPhone, IconMessage, IconSettings } from "./icons";

interface Props {
  activeKey: string;
  onNavigate: (key: string) => void;
  context?: "dashboard" | "admin";
}

export default function MobileBottomNav({ activeKey, onNavigate, context = "dashboard" }: Props) {
  const router = useRouter();
  const pathname = usePathname();

const getActiveKey = () => {
    const base = context === "admin" ? "/admin" : "/dashboard";
    if (pathname.startsWith(`${base}/calls`)) return "calls";
    if (pathname.startsWith(`${base}/chats`) || pathname.startsWith(`${base}/conversations`)) return "chats";
    if (pathname.startsWith(`${base}/config`) || pathname.startsWith(`${base}/security`) || pathname.startsWith(`${base}/account`) || pathname.startsWith(`${base}/integrations`) || pathname.startsWith(`${base}/team`)) return "settings";
    return "dashboard";
  };

  const items = [
    { key: "dashboard", icon: <IconHome className="w-5 h-5" />, label: "Dashboard" },
    { key: "calls", icon: <IconPhone className="w-5 h-5" />, label: "Połączenia" },
    { key: "chats", icon: <IconMessage className="w-5 h-5" />, label: "Rozmowy" },
    { key: "settings", icon: <IconSettings className="w-5 h-5" />, label: "Ustawienia" },
  ];

  const handleClick = (key: string) => {
    onNavigate(key);
    const base = context === "admin" ? "/admin" : "/dashboard";
    const routes: Record<string, string> = {
      dashboard: base,
      calls: `${base}/calls`,
      chats: `${base}/chats`,
      settings: `${base}/config`,
    };
    if (routes[key]) router.push(routes[key]);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c1929] border-t border-white/5 z-50 lg:hidden">
      <div className="flex">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => handleClick(item.key)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
              getActiveKey() === item.key ? "text-[#14b8a6]" : "text-white/30"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}