"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  businessId: string;
  onClick: () => void;
}

export default function RecentChatsPreview({ businessId, onClick }: Props) {
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("conversations")
      .select("id, caller_name, caller_id, channel, summary, status, tags, sentiment, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setConvs(data);
        setLoading(false);
      });
  }, [businessId]);

  if (loading) {
    return <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 p-5 text-sm text-zinc-400">Ładowanie rozmów...</div>;
  }

  const channelEmoji: Record<string, string> = { web: "💬", voice: "📞", widget: "🔗", sms: "📱" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Ostatnie rozmowy</p>
        <button onClick={onClick} className="text-xs text-[#0d9488] hover:text-[#0f766e] transition">Zobacz wszystkie →</button>
      </div>
      <div className="bg-white dark:bg-brand-900 rounded-xl border border-zinc-200 dark:border-brand-700 divide-y divide-zinc-100 dark:divide-brand-700">
        {convs.length === 0 ? (
          <div className="p-5 text-center text-sm text-zinc-400">Brak rozmów</div>
        ) : (
          convs.map(conv => (
            <div key={conv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0fdfa] dark:hover:bg-brand-800/30 transition cursor-pointer" onClick={onClick}>
              <span className="text-sm">{channelEmoji[conv.channel] || "💬"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{conv.caller_name || conv.caller_id || "Anonimowy"}</p>
                {conv.summary ? (
                  <p className="text-xs text-zinc-500 truncate">{conv.summary.replace(/[📋👤✅⚠️🏷️💡]\s*/g, "").slice(0, 80)}</p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Brak podsumowania</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(conv.tags || []).slice(0, 2).map((tag: string) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-brand-700 text-zinc-500 dark:text-zinc-400">#{tag}</span>
                ))}
              </div>
              <span className="text-[10px] text-zinc-400 shrink-0 whitespace-nowrap">{new Date(conv.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
