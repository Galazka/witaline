"use client";

import { useEffect, useState, useCallback } from "react";

interface CallbackRequest {
  id: string;
  caller_number: string;
  caller_name: string;
  matter: string;
  call_sid: string;
  handled: boolean;
  deleted_at: string | null;
  created_at: string;
}

export default function AdminCallbackRequests() {
  const [items, setItems] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "trashed">("active");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/admin/callback-requests?view=${view}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [view]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function apiAction(ids: string[], action: string) {
    await fetch("/api/admin/callback-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    fetchItems();
    setChecked(new Set());
  }

  async function permanentDelete(ids: string[]) {
    if (!confirm(`Usunąć na stałe ${ids.length} próśb?`)) return;
    await fetch("/api/admin/callback-requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchItems();
    setChecked(new Set());
  }

  if (loading) return <p className="text-center text-zinc-400 py-8">Ładowanie próśb o oddzwonienie...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 font-medium">
          {items.filter(i => !i.handled && !i.deleted_at).length} nieobsłużonych
        </p>
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

      {view === "trashed" && items.length === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">Kosz jest pusty.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className={`bg-white rounded-xl border p-4 space-y-2 ${item.deleted_at ? "opacity-60 border-zinc-200" : item.handled ? "border-zinc-200 opacity-60" : "border-l-4 border-l-[#0d9488] border-zinc-200"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={checked.has(item.id)} onChange={() => { setChecked(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; }); }} className="accent-[#0d9488] rounded" />
                <span className="text-sm font-bold text-zinc-900">{item.caller_number}</span>
              </div>
              {item.handled && !item.deleted_at && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Obsłużone</span>}
            </div>
            <p className="text-xs text-zinc-500">{item.caller_name || "—"}</p>
            <div className="bg-white rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-400 font-medium">Sprawa:</p>
              <p className="text-xs text-zinc-700">{item.matter}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{new Date(item.created_at).toLocaleString("pl-PL")}</span>
              <span className="font-mono">{item.call_sid?.slice(0, 20)}...</span>
            </div>
            <div className="flex gap-1 pt-1">
              {item.deleted_at ? (
                <>
                  <button onClick={() => apiAction([item.id], "restore")} className="text-[10px] px-2 py-1 rounded bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20">Przywróć</button>
                  <button onClick={() => permanentDelete([item.id])} className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">Usuń na stałe</button>
                </>
              ) : (
                <>
                  <button onClick={() => apiAction([item.id], item.handled ? "unhandled" : "handled")} className="text-[10px] px-2 py-1 rounded bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]">
                    {item.handled ? "Oznacz jako nieobsłużone" : "Oznacz jako obsłużone"}
                  </button>
                  <button onClick={() => apiAction([item.id], "trash")} className="text-[10px] px-2 py-1 rounded bg-brand-50 text-zinc-400 hover:bg-red-100 hover:text-red-500">🗑</button>
                </>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && view === "active" && (
          <div className="col-span-2 border border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">Brak próśb o oddzwonienie.</p>
          </div>
        )}
      </div>
    </div>
  );
}
