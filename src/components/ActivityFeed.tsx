"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Activity {
  id: string;
  type: "call" | "lead" | "booking" | "feedback" | "system" | "sms";
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ActivityFeedProps {
  businessId: string;
}

const TYPE_ICONS: Record<string, string> = {
  call: "📞",
  lead: "⭐",
  booking: "📅",
  feedback: "💬",
  system: "⚙️",
  sms: "✉️",
};

const TYPE_COLORS: Record<string, string> = {
  call: "bg-blue-500",
  lead: "bg-yellow-500",
  booking: "bg-purple-500",
  feedback: "bg-green-500",
  system: "bg-white",
  sms: "bg-pink-500",
};

type DateFilter = "7d" | "30d" | "all" | "custom";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL");
}

export default function ActivityFeed({ businessId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [dateFilter, setDateFilter] = useState<DateFilter>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ businessId });
    const now = new Date();
    let from: string | null = null;
    let to: string | null = null;

    if (dateFilter === "7d") {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      from = d.toISOString();
    } else if (dateFilter === "30d") {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      from = d.toISOString();
    } else if (dateFilter === "custom") {
      if (customFrom) from = new Date(customFrom).toISOString();
      if (customTo) to = new Date(customTo + "T23:59:59").toISOString();
    }
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/business/notifications?${params.toString()}`;
  }, [businessId, dateFilter, customFrom, customTo]);

  const fetchActivities = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(buildUrl());
      const data = await res.json();
      if (data.notifications) setActivities(data.notifications);
    } catch { /* ignore */ }
    setLoading(false);
  }, [businessId, buildUrl]);

  useEffect(() => {
    fetchActivities();
    intervalRef.current = setInterval(fetchActivities, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchActivities]);

  async function markRead(id: string) {
    await fetch(`/api/business/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  }

  async function markAllRead() {
    if (!activities.length) return;
    const firstId = activities[0].id;
    await fetch(`/api/business/notifications/${firstId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setActivities((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  const unreadCount = activities.filter((a) => !a.is_read).length;
  const visible = activities.slice(0, visibleCount);
  const hasMore = activities.length > visibleCount;

  if (loading) {
    return (
      <div className="bg-white/55 backdrop-blur-xl border border-white/20 rounded-xl p-5 text-center text-sm text-zinc-500">
        Ładowanie aktywności...
      </div>
    );
  }

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/20 rounded-xl">
      {/* Header with date filter */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Ostatnia aktywność
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-medium text-[#0d9488] bg-[#0d9488]/10 px-1.5 py-0.5 rounded-full">
              {unreadCount} nowe
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Date filter pills */}
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5">
            {(["7d", "30d", "all"] as DateFilter[]).map((f) => (
              <button key={f} onClick={() => setDateFilter(f)} className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${dateFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
                {f === "7d" ? "7 dni" : f === "30d" ? "30 dni" : "Wszystkie"}
              </button>
            ))}
            <button onClick={() => setDateFilter("custom")} className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${dateFilter === "custom" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              Zakres
            </button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#0d9488] hover:text-[#0d9488] transition">Oznacz wszystkie jako przeczytane</button>
          )}
        </div>
      </div>

      {/* Custom date range */}
      {dateFilter === "custom" && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-zinc-200 bg-zinc-50">
          <label className="text-[10px] text-zinc-500">Od:</label>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-2 py-1 text-xs border border-zinc-200 rounded bg-white" />
          <label className="text-[10px] text-zinc-500">Do:</label>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-2 py-1 text-xs border border-zinc-200 rounded bg-white" />
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-zinc-200" />

        {visible.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">
            Brak aktywności
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/30">
            {visible.map((activity) => {
              const isUnread = !activity.is_read;
              return (
                <button
                  key={activity.id}
                  onClick={() => { if (isUnread) markRead(activity.id); }}
                  className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition ${
                    isUnread ? "hover:bg-white/[0.03]" : "opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full ${TYPE_COLORS[activity.type] || "bg-white"} ring-4 ring-zinc-800/50`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {TYPE_ICONS[activity.type] || "🔔"} {activity.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 shrink-0 whitespace-nowrap">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{activity.message}</p>
                  </div>
                  {isUnread && <span className="w-1.5 h-1.5 bg-[#0d9488] rounded-full shrink-0 mt-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="px-5 py-3 border-t border-zinc-200 text-center">
          <button onClick={() => setVisibleCount((c) => c + 10)} className="text-xs text-zinc-500 hover:text-zinc-700 transition">
            Pokaż więcej ({activities.length - visibleCount} pozostało)
          </button>
        </div>
      )}
    </div>
  );
}
