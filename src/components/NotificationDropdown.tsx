"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  business_id: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} godz temu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL");
}

function typeIcon(type: string) {
  const cls = "w-4 h-4";
  switch (type) {
    case "call":
      return <svg className={`${cls} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
    case "lead":
      return <svg className={`${cls} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    case "booking":
      return <svg className={`${cls} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case "feedback":
      return <svg className={`${cls} text-amber-500`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
    case "sms":
      return <svg className={`${cls} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
    default:
      return <svg className={`${cls} text-zinc-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
}

interface Props {
  context?: "admin" | "dashboard";
  businessId?: string;
}

export default function NotificationDropdown({ context, businessId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setUnreadCount(json.unread_count || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function toggleSaved(id: string, currentlySaved: boolean) {
    const meta = { saved: !currentlySaved };
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, metadata: meta }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, metadata: meta } : n)));
  }

  async function remove(id: string) {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const removed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
  }

  const saved = notifications.filter((n) => (n.metadata as Record<string, unknown>)?.saved === true);
  const unsavedUnread = notifications.filter((n) => !n.is_read && !((n.metadata as Record<string, unknown>)?.saved === true));

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 relative hidden sm:block">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Powiadomienia</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                Oznacz wszystkie jako przeczytane
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Ładowanie...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-8 h-8 text-zinc-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs text-zinc-400">Brak powiadomień</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {/* Saved items */}
                {saved.map((n) => (
                  <NotificationRow key={n.id} item={n} onMarkRead={markRead} onToggleSaved={toggleSaved} onRemove={remove} />
                ))}
                {/* Unread unsaved */}
                {unsavedUnread.map((n) => (
                  <NotificationRow key={n.id} item={n} onMarkRead={markRead} onToggleSaved={toggleSaved} onRemove={remove} />
                ))}
                {/* Read */}
                {notifications.filter((n) => n.is_read && !((n.metadata as Record<string, unknown>)?.saved === true)).map((n) => (
                  <NotificationRow key={n.id} item={n} onMarkRead={markRead} onToggleSaved={toggleSaved} onRemove={remove} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onMarkRead,
  onToggleSaved,
  onRemove,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onToggleSaved: (id: string, saved: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const saved = (item.metadata as Record<string, unknown>)?.saved === true;
  const [removing, setRemoving] = useState(false);

  return (
    <div className={`px-4 py-3 hover:bg-zinc-50 group ${!item.is_read ? "bg-brand-50/40" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{typeIcon(item.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs ${!item.is_read ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"}`}>{item.title}</p>
            <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(item.created_at)}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.message}</p>
          <div className={`flex items-center gap-2 mt-1.5 ${removing ? "opacity-40 pointer-events-none" : ""}`}>
            {!item.is_read && (
              <button onClick={() => onMarkRead(item.id)} className="text-[10px] text-brand-500 hover:text-brand-600 font-medium">
                Oznacz jako przeczytane
              </button>
            )}
            <button onClick={() => onToggleSaved(item.id, saved)} className={`text-[10px] font-medium ${saved ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600"}`}>
              {saved ? "Zapisane" : "Zachowaj na później"}
            </button>
            <button
              onClick={async () => {
                setRemoving(true);
                await onRemove(item.id);
              }}
              className="text-[10px] text-red-400 hover:text-red-600 font-medium"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
