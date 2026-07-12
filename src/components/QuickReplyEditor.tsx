"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface QuickReply {
  id: string;
  text: string;
  sort_order: number;
  active: boolean;
}

interface Props {
  businessId: string;
}

export default function QuickReplyEditor({ businessId }: Props) {
  const [items, setItems] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, [businessId]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/quick-replies?businessId=${businessId}`);
      if (res.ok) setItems(await res.json());
    } catch {}
    setLoading(false);
  }

  async function addItem() {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/business/quick-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, text: newText.trim() }),
      });
      if (res.ok) {
        setNewText("");
        await fetchItems();
      }
    } catch {}
    setSaving(false);
  }

  async function toggleActive(item: QuickReply) {
    await fetch("/api/business/quick-replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    await fetchItems();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/business/quick-replies?id=${id}`, { method: "DELETE" });
    await fetchItems();
  }

  if (loading) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          placeholder="Np. Jaka jest cena?"
          className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
        />
        <button
          onClick={addItem}
          disabled={saving || !newText.trim()}
          className="px-3 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition disabled:opacity-50"
        >
          + Dodaj
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-zinc-400 italic">Brak szybkich odpowiedzi. Dodaj pierwszą.</p>
      )}

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg">
            <span className={`flex-1 text-sm ${item.active ? "text-zinc-800" : "text-zinc-400 line-through"}`}>
              {item.text}
            </span>
            <button
              onClick={() => toggleActive(item)}
              className={`text-xs px-2 py-1 rounded-md ${item.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"}`}
            >
              {item.active ? "Widoczne" : "Ukryte"}
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
            >
              Usuń
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
