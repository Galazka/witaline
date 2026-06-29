"use client";

import { useEffect, useState, useCallback } from "react";

interface FeedbackItem {
  id: string;
  conversation_id: string | null;
  business_id: string | null;
  rating: number;
  source: string;
  deleted_at: string | null;
  created_at: string;
  conversations?: { summary: string } | null;
  businesses?: { name: string } | null;
}

const ratingMeta: Record<number, { emoji: string; label: string; color: string }> = {
  3: { emoji: "😊", label: "Zadowolony", color: "bg-[#ccfbf1] text-[#0d9488]" },
  2: { emoji: "😐", label: "Neutralny", color: "bg-amber-100 text-amber-700" },
  1: { emoji: "😞", label: "Niezadowolony", color: "bg-red-100 text-red-600" },
};

export default function AdminFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");
  const [view, setView] = useState<"active" | "trashed">("active");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/admin/feedback?view=${view}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [view]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function apiAction(ids: string[], action: string) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    fetchItems();
    setChecked(new Set());
  }

  async function permanentDelete(ids: string[]) {
    if (!confirm(`Usunąć na stałe ${ids.length} opinii?`)) return;
    await fetch("/api/admin/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchItems();
    setChecked(new Set());
  }

  const counts: Record<number, number> = {};
  items.forEach(i => { counts[i.rating] = (counts[i.rating] || 0) + 1; });

  const filtered = items.filter(i => filter === "all" || i.rating === filter);

  if (loading) return <p className="text-center text-zinc-400 py-8">Ładowanie opinii...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-xs rounded-lg transition ${filter === "all" ? "bg-[#0d9488] text-white" : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"}`}>Wszystkie ({items.length})</button>
          {[3, 2, 1].map(r => (
            <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 text-xs rounded-lg transition ${filter === r ? "bg-[#0d9488] text-white" : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"}`}>
              {ratingMeta[r].emoji} {ratingMeta[r].label} ({counts[r] || 0})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setView("active"); setChecked(new Set()); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${view === "active" ? "bg-[#ccfbf1] text-[#0d9488]" : "text-zinc-500 hover:text-zinc-700"}`}>Aktywne</button>
          <button onClick={() => { setView("trashed"); setChecked(new Set()); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${view === "trashed" ? "bg-red-100 text-red-600" : "text-zinc-500 hover:text-zinc-700"}`}>Kosz</button>
        </div>
      </div>

      {checked.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 rounded-xl px-4 py-3">
          <span className="text-sm text-zinc-700 font-medium">Wybrano {checked.size}</span>
          {view === "active" ? (
            <button onClick={() => apiAction([...checked], "trash")} className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Przenieś do kosza</button>
          ) : (
            <>
              <button onClick={() => apiAction([...checked], "restore")} className="text-sm px-3 py-1.5 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e]">Przywróć</button>
              <button onClick={() => permanentDelete([...checked])} className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">Usuń na stałe</button>
            </>
          )}
          <button onClick={() => setChecked(new Set())} className="text-sm text-zinc-500 hover:text-zinc-700">Anuluj</button>
        </div>
      )}

      {view === "trashed" && filtered.length === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">Kosz jest pusty.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border p-4 space-y-2 ${item.deleted_at ? "opacity-60 border-zinc-200" : "border-zinc-200"} relative`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={checked.has(item.id)} onChange={() => { setChecked(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; }); }} className="accent-[#0d9488] rounded" />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ratingMeta[item.rating]?.color || "bg-brand-50 text-zinc-600"}`}>
                    {ratingMeta[item.rating]?.emoji} {ratingMeta[item.rating]?.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 uppercase">{item.source}</span>
                </div>
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {item.conversations?.summary && (
                <p className="text-xs text-zinc-600 line-clamp-2">{item.conversations.summary}</p>
              )}
              {item.businesses?.name && (
                <p className="text-[10px] text-zinc-400">Firma: {item.businesses.name}</p>
              )}
              <div className="flex gap-1 pt-1">
                {item.deleted_at ? (
                  <>
                    <button onClick={() => apiAction([item.id], "restore")} className="text-[10px] px-2 py-1 rounded bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20">Przywróć</button>
                    <button onClick={() => permanentDelete([item.id])} className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">Usuń na stałe</button>
                  </>
                ) : (
                  <button onClick={() => apiAction([item.id], "trash")} className="text-[10px] px-2 py-1 rounded bg-brand-50 text-zinc-400 hover:bg-red-100 hover:text-red-500">🗑 Kosz</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
