"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  businessId: string;
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalCalls: number;
  avgMessagesPerConv: number;
  channelBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

export default function StatsOverview({ businessId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, [businessId]);

  async function fetchStats() {
    setLoading(true);

    const [convsRes, msgsRes, callsRes] = await Promise.all([
      supabase.from("conversations").select("id, channel, sentiment, created_at").eq("business_id", businessId),
      supabase.from("messages").select("id, conversation_id", { count: "exact" }).eq("business_id", businessId),
      supabase.from("call_logs").select("id, created_at").eq("business_id", businessId),
    ]);

    const convs = convsRes.data || [];
    const msgs = msgsRes.data || [];
    const calls = callsRes.data || [];

    // Channel breakdown
    const channelBreakdown: Record<string, number> = {};
    convs.forEach(c => { channelBreakdown[c.channel] = (channelBreakdown[c.channel] || 0) + 1; });

    // Sentiment breakdown
    const sentimentBreakdown: Record<string, number> = {};
    convs.forEach(c => {
      const s = c.sentiment || "unknown";
      sentimentBreakdown[s] = (sentimentBreakdown[s] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const now = new Date();
    const recentActivity: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = convs.filter(c => c.created_at.startsWith(dateStr)).length;
      recentActivity.push({ date: dateStr, count });
    }

    // Unique conversations with messages
    const uniqueConvs = new Set(msgs.map(m => m.conversation_id));

    setStats({
      totalConversations: convs.length,
      totalMessages: msgs.length,
      totalCalls: calls.length,
      avgMessagesPerConv: uniqueConvs.size > 0 ? Math.round(msgs.length / uniqueConvs.size * 10) / 10 : 0,
      channelBreakdown,
      sentimentBreakdown,
      recentActivity,
    });

    setLoading(false);
  }

  if (loading) {
    return <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-6 text-center text-sm text-zinc-400">Ładowanie statystyk...</div>;
  }

  if (!stats) return null;

  const maxActivity = Math.max(...stats.recentActivity.map(a => a.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Main stats */}
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Rozmowy</p>
        <p className="text-3xl font-bold text-[#0d9488] mt-1">{stats.totalConversations}</p>
        <p className="text-xs text-zinc-500 mt-1">łącznie</p>
      </div>
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Wiadomości</p>
        <p className="text-3xl font-bold text-[#0d9488] mt-1">{stats.totalMessages}</p>
        <p className="text-xs text-zinc-500 mt-1">śr. {stats.avgMessagesPerConv}/rozmowę</p>
      </div>
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Połączenia</p>
        <p className="text-3xl font-bold text-[#0d9488] mt-1">{stats.totalCalls}</p>
        <p className="text-xs text-zinc-500 mt-1">telefoniczne</p>
      </div>
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Kanały</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {Object.entries(stats.channelBreakdown).map(([ch, count]) => (
            <span key={ch} className="text-xs px-2 py-1 bg-brand-50 dark:bg-brand-800 text-zinc-600 dark:text-zinc-300 rounded-full">
              {ch === "web" ? "💬" : ch === "voice" ? "📞" : ch === "widget" ? "🔗" : "📱"} {count}
            </span>
          ))}
        </div>
      </div>

      {/* Activity chart */}
      <div className="md:col-span-2 bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Aktywność (7 dni)</p>
        <div className="flex items-end gap-1 h-24">
          {stats.recentActivity.map((a, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-[#0d9488] rounded-t transition-all"
                style={{ height: `${(a.count / maxActivity) * 100}%`, minHeight: a.count > 0 ? "4px" : "0" }}
              />
              <span className="text-[10px] text-zinc-400">
                {new Date(a.date).toLocaleDateString("pl-PL", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div className="md:col-span-2 bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Sentyment klientów</p>
        <div className="flex gap-4">
          {[
            { key: "positive", label: "Pozytywny", emoji: "😊", color: "bg-green-100 text-green-700" },
            { key: "neutral", label: "Neutralny", emoji: "😐", color: "bg-brand-50 text-zinc-600" },
            { key: "negative", label: "Negatywny", emoji: "😟", color: "bg-red-100 text-red-700" },
          ].map(s => (
            <div key={s.key} className={`flex-1 text-center p-3 rounded-xl ${s.color}`}>
              <span className="text-2xl">{s.emoji}</span>
              <p className="text-lg font-bold mt-1">{stats.sentimentBreakdown[s.key] || 0}</p>
              <p className="text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
