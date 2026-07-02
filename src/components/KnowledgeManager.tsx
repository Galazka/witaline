"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { BusinessKnowledge } from "@/types/database";

interface Props {
  businessId: string;
}

const CATEGORIES = [
  { value: "general", label: "🏷️ Ogólne", color: "bg-brand-50 text-zinc-700" },
  { value: "services", label: "🛎️ Usługi", color: "bg-blue-100 text-blue-700" },
  { value: "pricing", label: "💰 Cennik", color: "bg-green-100 text-green-700" },
  { value: "hours", label: "🕐 Godziny", color: "bg-yellow-100 text-yellow-700" },
  { value: "location", label: "📍 Lokalizacja", color: "bg-purple-100 text-purple-700" },
  { value: "faq", label: "❓ FAQ", color: "bg-orange-100 text-orange-700" },
  { value: "products", label: "📦 Produkty", color: "bg-cyan-100 text-cyan-700" },
  { value: "policies", label: "📋 Zasady", color: "bg-red-100 text-red-700" },
  { value: "team", label: "👥 Zespół", color: "bg-pink-100 text-pink-700" },
  { value: "promotions", label: "🎉 Promocje", color: "bg-amber-100 text-amber-700" },
  { value: "custom", label: "✏️ Własne", color: "bg-indigo-100 text-indigo-700" },
];

export default function KnowledgeManager({ businessId }: Props) {
  const [entries, setEntries] = useState<BusinessKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BusinessKnowledge | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => { fetchEntries(); }, [businessId, filter]);

  async function fetchEntries() {
    setLoading(true);
    let query = supabase
      .from("business_knowledge")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });

    if (filter !== "all") query = query.eq("category", filter);

    const { data } = await query;
    setEntries((data as BusinessKnowledge[]) || []);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title || !form.content) return;
    setSaving(true);

    if (editing) {
      await supabase.from("business_knowledge").update({
        title: form.title, content: form.content, category: form.category,
      }).eq("id", editing.id);
    } else {
      await supabase.from("business_knowledge").insert({
        business_id: businessId, ...form,
      });
    }

    setForm({ title: "", content: "", category: "general" });
    setEditing(null);
    setShowForm(false);
    setSaving(false);
    fetchEntries();
  }

  async function handleDelete(id: string) {
    if (!confirm("Usunąć ten wpis?")) return;
    await supabase.from("business_knowledge").delete().eq("id", id);
    fetchEntries();
  }

  async function handleToggle(id: string, active: boolean) {
    await supabase.from("business_knowledge").update({ active: !active }).eq("id", id);
    fetchEntries();
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Baza wiedzy bota</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Bot korzysta z tych danych podczas rozmów</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", content: "", category: "general" }); }}
          className="px-4 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition"
        >
          + Dodaj wpis
        </button>
      </div>

      {/* Category filter */}
      <div className="px-5 py-3 border-b border-zinc-100 flex gap-1.5 overflow-x-auto">
        <button onClick={() => setFilter("all")} className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${
          filter === "all" ? "bg-[#0d9488] text-white" : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"
        }`}>Wszystkie</button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilter(c.value)} className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${
            filter === c.value ? "bg-[#0d9488] text-white" : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"
          }`}>{c.label}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="px-5 py-4 bg-brand-50 border-b border-brand-100 space-y-3">
          <div className="flex gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tytuł wpisu"
              className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Treść wiedzy dla bota..."
            rows={4}
            className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title || !form.content}
              className="px-4 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition disabled:opacity-50">
              {saving ? "Zapisywanie..." : editing ? "Aktualizuj" : "Dodaj"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-brand-50 text-zinc-600 text-sm rounded-lg hover:bg-[#ccfbf1] transition">
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-zinc-400">Ładowanie...</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-sm text-zinc-400">Brak wpisów. Dodaj pierwszy!</div>
        ) : (
          entries.map(entry => {
            const cat = CATEGORIES.find(c => c.value === entry.category);
            return (
              <div key={entry.id} className={`px-5 py-3 flex items-start gap-3 hover:bg-[#f0fdfa] transition ${
                !entry.active ? "opacity-50" : ""
              }`}>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${cat?.color || "bg-brand-50"}`}>
                  {cat?.label || entry.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{entry.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{entry.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggle(entry.id, entry.active)}
                    className={`p-1.5 rounded-lg text-xs transition ${entry.active ? "bg-green-100 text-green-700" : "bg-brand-50 text-zinc-400"}`}
                    title={entry.active ? "Wyłącz" : "Włącz"}>
                    {entry.active ? "✓" : "○"}
                  </button>
                  <button onClick={() => { setEditing(entry); setForm({ title: entry.title, content: entry.content, category: entry.category }); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-brand-50 text-zinc-600 text-xs hover:bg-[#ccfbf1] transition" title="Edytuj">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-500 text-xs hover:bg-red-100 transition" title="Usuń">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
