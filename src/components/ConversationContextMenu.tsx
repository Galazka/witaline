"use client";

import { useState, useRef, useEffect } from "react";

const FLAG_COLORS = [
  { value: "red", class: "bg-red-500" },
  { value: "orange", class: "bg-orange-500" },
  { value: "amber", class: "bg-amber-500" },
  { value: "green", class: "bg-green-500" },
  { value: "blue", class: "bg-blue-500" },
  { value: "purple", class: "bg-purple-500" },
  { value: "pink", class: "bg-pink-500" },
];

interface Props {
  conversationId: string;
  isFlagged: boolean;
  flagColor: string | null;
  onUpdate: () => void;
  children: React.ReactNode;
}

export default function ConversationContextMenu({ conversationId, isFlagged, flagColor, onUpdate, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function api(patch: Record<string, any>) {
    await fetch(`/api/business/chats/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onUpdate();
  }

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 text-sm">
          {/* Flag / Unflag */}
          <button onClick={() => { api({ flagged: !isFlagged }); setOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2">
            <span>{isFlagged ? "🙈" : "🚩"}</span>
            {isFlagged ? "Usuń flagę" : "Oflaguj"}
          </button>

          {/* Flag color */}
          {isFlagged && (
            <div className="px-4 py-2 border-t border-zinc-50">
              <p className="text-[10px] text-zinc-400 uppercase mb-1.5">Kolor flagi</p>
              <div className="flex gap-1.5">
                {FLAG_COLORS.map(c => (
                  <button key={c.value} onClick={() => { api({ flag_color: c.value }); setOpen(false); }}
                    className={`w-5 h-5 rounded-full ${c.class} ${flagColor === c.value ? "ring-2 ring-offset-1 ring-zinc-400" : ""}`}
                    title={c.value} />
                ))}
                <button onClick={() => { api({ flag_color: null }); setOpen(false); }}
                  className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center text-[10px] text-zinc-400"
                  title="Bez koloru">✕</button>
              </div>
            </div>
          )}

          {/* Trash */}
          <button onClick={() => { if (confirm("Przenieść do kosza?")) { api({ deleted: true }); setOpen(false); } }}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-zinc-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Przenieś do kosza
          </button>
        </div>
      )}
    </div>
  );
}
