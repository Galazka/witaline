"use client";

import { useState, useEffect } from "react";

interface BlockedCaller {
  id: string;
  phone: string;
  reason: string;
  blocked_by: string;
  created_at: string;
}

export default function AdminBlocklist() {
  const [items, setItems] = useState<BlockedCaller[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blocklist", {
        headers: { "x-admin-key": "admin@witaline.pl" },
      });
      if (!res.ok) throw new Error("Błąd ładowania");
      setItems(await res.json());
    } catch {
      setError("Nie udało się załadować listy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/blocklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "admin@witaline.pl",
        },
        body: JSON.stringify({ phone: phone.trim(), reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Błąd dodawania");
      }
      setPhone("");
      setReason("");
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/blocklist?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": "admin@witaline.pl" },
      });
      if (!res.ok) throw new Error("Błąd usuwania");
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      setError("Nie udało się usunąć");
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Dodaj numer do blokady</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+48 123 456 789"
            className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
          />
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Powód blokady"
            className="flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={adding || !phone.trim()}
            className="bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "Dodawanie..." : "Dodaj"}
          </button>
        </form>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-400">Ładowanie...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-400">Brak zablokowanych numerów.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Powód</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Zablokował</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-zinc-50 hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.phone}</td>
                    <td className="px-4 py-3 text-zinc-600">{item.reason}</td>
                    <td className="px-4 py-3 text-zinc-600">{item.blocked_by}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(item.created_at).toLocaleString("pl-PL")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
