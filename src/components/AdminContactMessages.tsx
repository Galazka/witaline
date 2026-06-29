"use client";

import { useEffect, useState, useCallback } from "react";

interface ContactMessage {
  id: string;
  company: string;
  contact: string;
  website: string | null;
  message: string;
  read: boolean;
  deleted_at: string | null;
  created_at: string;
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"active" | "trashed">("active");

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/admin/contact-messages?view=${view}`);
    if (res.ok) {
      setMessages(await res.json());
    }
    setLoading(false);
  }, [view]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function apiAction(ids: string[], action: string) {
    await fetch("/api/admin/contact-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    fetchMessages();
    setChecked(new Set());
  }

  async function permanentDelete(ids: string[]) {
    if (!confirm(`Usunąć na stałe ${ids.length} wiadomości? Tej operacji nie można cofnąć.`)) return;
    await fetch("/api/admin/contact-messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchMessages();
    setChecked(new Set());
    if (ids.includes(selectedId || "")) setSelectedId(null);
  }

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (checked.size === messages.length) setChecked(new Set());
    else setChecked(new Set(messages.map(m => m.id)));
  }

  const unread = messages.filter(m => !m.read).length;
  const selected = messages.find(m => m.id === selectedId);

  if (loading) return <p className="text-center text-zinc-400 py-8">Ładowanie wiadomości...</p>;

  if (!messages.length && view === "active") return (
    <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
      <p className="text-sm text-zinc-400">Brak wiadomości kontaktowych.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => { setView("active"); setChecked(new Set()); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${view === "active" ? "bg-[#ccfbf1] text-[#0d9488]" : "text-zinc-500 hover:text-zinc-700"}`}>
            Aktywne {view === "active" && unread > 0 && <span className="ml-1 text-xs">({unread})</span>}
          </button>
          <button onClick={() => { setView("trashed"); setChecked(new Set()); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${view === "trashed" ? "bg-red-100 text-red-600" : "text-zinc-500 hover:text-zinc-700"}`}>
            Kosz
          </button>
        </div>
        {view === "active" && (
          <p className="text-xs text-zinc-400">{unread > 0 ? `${unread} nieprzeczytanych` : "Wszystkie przeczytane"}</p>
        )}
      </div>

      {/* Bulk action bar */}
      {checked.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 rounded-xl px-4 py-3">
          <span className="text-sm text-zinc-700 font-medium">Wybrano {checked.size}</span>
          {view === "active" ? (
            <button onClick={() => apiAction([...checked], "trash")} className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
              Przenieś do kosza
            </button>
          ) : (
            <>
              <button onClick={() => apiAction([...checked], "restore")} className="text-sm px-3 py-1.5 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition">
                Przywróć
              </button>
              <button onClick={() => permanentDelete([...checked])} className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
                Usuń na stałe
              </button>
            </>
          )}
          <button onClick={() => setChecked(new Set())} className="text-sm text-zinc-500 hover:text-zinc-700">Anuluj</button>
        </div>
      )}

      {view === "trashed" && messages.length === 0 && (
        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-400">Kosz jest pusty.</p>
        </div>
      )}

      {/* List */}
      {messages.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {/* Select all */}
            <label className="flex items-center gap-2 px-1 py-1 cursor-pointer">
              <input type="checkbox" checked={checked.size === messages.length && messages.length > 0} onChange={toggleAll} className="accent-[#0d9488] rounded" />
              <span className="text-xs text-zinc-400">Zaznacz wszystkie</span>
            </label>
            {messages.map(msg => {
              const isTrashed = !!msg.deleted_at;
              return (
                <div key={msg.id} className={`flex items-start gap-2 ${isTrashed ? "opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked.has(msg.id)}
                    onChange={() => toggleCheck(msg.id)}
                    className="accent-[#0d9488] rounded mt-4"
                  />
                  <button
                    onClick={() => { setSelectedId(msg.id); if (!msg.read) apiAction([msg.id], "read"); }}
                    className={`flex-1 text-left bg-white rounded-xl border p-4 transition hover:shadow-sm ${selectedId === msg.id ? "border-[#0d9488] shadow-sm" : "border-zinc-200"} ${!msg.read && !isTrashed ? "border-l-4 border-l-[#0d9488]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{msg.company}</p>
                        <p className="text-xs text-zinc-500 truncate">{msg.contact}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0 whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{msg.message}</p>
                  </button>
                  {isTrashed ? (
                    <div className="flex flex-col gap-1 mt-3 shrink-0">
                      <button onClick={() => apiAction([msg.id], "restore")} className="text-[10px] px-2 py-1 rounded bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20" title="Przywróć">↩</button>
                      <button onClick={() => permanentDelete([msg.id])} className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200" title="Usuń na stałe">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => apiAction([msg.id], "trash")} className="text-[10px] px-2 py-1 rounded bg-brand-50 text-zinc-400 hover:bg-red-100 hover:text-red-500 mt-3 shrink-0" title="Przenieś do kosza">
                      🗑
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4 h-fit sticky top-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{selected.company}</h3>
                  <p className="text-sm text-zinc-500">{selected.contact}</p>
                </div>
                <span className="text-xs text-zinc-400">{new Date(selected.created_at).toLocaleString("pl-PL")}</span>
              </div>
              {selected.website && (
                <div className="bg-white rounded-lg px-4 py-2 text-sm">
                  <span className="text-zinc-400">www: </span>
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="text-[#0d9488] hover:underline">{selected.website}</a>
                </div>
              )}
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => apiAction([selected.id], selected.read ? "unread" : "read")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${selected.read ? "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]" : "bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20"}`}
                >
                  {selected.read ? "Oznacz jako nieprzeczytane" : "Oznacz jako przeczytane"}
                </button>
                {selected.deleted_at ? (
                  <button onClick={() => apiAction([selected.id], "restore")} className="text-xs px-3 py-1.5 rounded-lg bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20 font-medium">
                    Przywróć
                  </button>
                ) : (
                  <button onClick={() => apiAction([selected.id], "trash")} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-medium">
                    Przenieś do kosza
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
