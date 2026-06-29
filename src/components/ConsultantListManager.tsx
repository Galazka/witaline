"use client";

import { useState, useEffect, useCallback } from "react";
import type { BusinessConsultant } from "@/types/database";

interface Props {
  businessId: string;
  label?: string;
  description?: string;
  maxConsultants?: number;
}

export default function ConsultantListManager({ businessId, label, description, maxConsultants }: Props) {
  const [consultants, setConsultants] = useState<BusinessConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);

  // Nowy konsultant
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Edycja inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const showMsg = useCallback((msg: string, ok: boolean) => {
    setMessage(msg);
    setMessageOk(ok);
    setTimeout(() => { setMessage(""); }, 4000);
  }, []);

  const fetchConsultants = useCallback(async () => {
    try {
      const res = await fetch(`/api/business/consultants?businessId=${businessId}`);
      if (!res.ok) throw new Error("Błąd ładowania");
      const data = await res.json();
      setConsultants(data);
    } catch {
      showMsg("Nie udało się załadować listy konsultantów.", false);
    }
    setLoading(false);
  }, [businessId, showMsg]);

  useEffect(() => { fetchConsultants(); }, [fetchConsultants]);

  async function handleAdd() {
    if (!newName.trim() || !newPhone.trim()) {
      showMsg("Podaj imię i numer telefonu.", false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/business/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, name: newName.trim(), phone: newPhone.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Błąd zapisu");
      }
      setNewName("");
      setNewPhone("");
      showMsg("✅ Dodano konsultanta.", true);
      await fetchConsultants();
    } catch (e: unknown) {
      showMsg(`❌ ${e instanceof Error ? e.message : "Błąd"}`, false);
    }
    setSaving(false);
  }

  function startEdit(c: BusinessConsultant) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    if (!editName.trim() || !editPhone.trim()) {
      showMsg("Imię i numer są wymagane.", false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/business/consultants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name: editName.trim(), phone: editPhone.trim() }),
      });
      if (!res.ok) throw new Error("Błąd zapisu");
      setEditingId(null);
      showMsg("✅ Zapisano.", true);
      await fetchConsultants();
    } catch {
      showMsg("❌ Błąd zapisu.", false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Usunąć ${name} z listy konsultantów?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/business/consultants?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd usuwania");
      showMsg(`🗑 Usunięto ${name}.`, true);
      await fetchConsultants();
    } catch {
      showMsg("❌ Błąd usuwania.", false);
    }
    setSaving(false);
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const list = [...consultants];
    const a = list[index];
    const b = list[index - 1];

    // Swap sort_order via PATCH
    const res1 = fetch("/api/business/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
    });
    const res2 = fetch("/api/business/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
    });
    await Promise.all([res1, res2]);
    await fetchConsultants();
  }

  async function handleMoveDown(index: number) {
    if (index >= consultants.length - 1) return;
    const list = [...consultants];
    const a = list[index];
    const b = list[index + 1];

    const res1 = fetch("/api/business/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
    });
    const res2 = fetch("/api/business/consultants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
    });
    await Promise.all([res1, res2]);
    await fetchConsultants();
  }

  return (
    <div className="space-y-4">
      {(label || description) && (
        <div>
          {label && <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>}
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
      )}

      {message && (
        <p className={`text-sm px-3 py-2 rounded-lg ${messageOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Ładowanie konsultantów...</p>
      ) : (
        <div className="space-y-2">
          {consultants.length === 0 && (
            <p className="text-sm text-zinc-400 italic">Brak dodanych konsultantów. Maja przekaże rozmowę na numer wskazany jako &bdquo;Telefon przekierowania&rdquo;.</p>
          )}

          {consultants.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2.5">
              {/* Move buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => handleMoveUp(i)}
                  disabled={i === 0 || saving}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-20 text-xs leading-none"
                  title="Przesuń w górę"
                >▲</button>
                <button
                  onClick={() => handleMoveDown(i)}
                  disabled={i >= consultants.length - 1 || saving}
                  className="text-zinc-300 hover:text-zinc-600 disabled:opacity-20 text-xs leading-none"
                  title="Przesuń w dół"
                >▼</button>
              </div>

              {/* Editable fields */}
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Imię"
                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
                  />
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+48..."
                    className="w-40 px-2 py-1 text-sm border border-brand-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
                  />
                  <button onClick={handleSaveEdit} disabled={saving} className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium shrink-0">Zapisz</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-zinc-400 hover:text-zinc-600 shrink-0">Anuluj</button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                  <span className="w-40 text-sm text-zinc-600 font-mono truncate">{c.phone}</span>
                  <button onClick={() => startEdit(c)} disabled={saving} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 shrink-0">Edytuj</button>
                  <button onClick={() => handleDelete(c.id, c.name)} disabled={saving} className="text-xs text-red-400 hover:text-red-600 shrink-0">Usuń</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new consultant */}
      {maxConsultants !== undefined && consultants.length >= maxConsultants ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-700">
          Osiągnięto limit konsultantów (max {maxConsultants}). Zwiększ plan, aby dodać więcej.
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-zinc-50 border border-dashed border-zinc-300 rounded-lg px-3 py-2.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Imię"
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+48 123 456 789"
            className="w-40 px-2 py-1 text-sm border border-zinc-200 rounded-md bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim() || !newPhone.trim()}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-[#0d9488] rounded-md hover:bg-[#0f766e] disabled:opacity-40 transition"
          >
            + Dodaj
          </button>
        </div>
      )}
    </div>
  );
}