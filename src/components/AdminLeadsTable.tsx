"use client";

import { useState, useEffect } from "react";
import type { Lead, LeadType } from "@/types/database";

interface Props {
  onRefresh: () => void;
  onActivate: (id: string, systemPrompt: string) => void;
  leads: Lead[];
}

const typeConfig: Record<LeadType, { label: string; color: string; icon: string }> = {
  zgloszenie_firmy: { label: "Zgłoszenie firmy", color: "bg-purple-100 text-purple-700", icon: "🏢" },
  kontakt: { label: "Kontakt tel.", color: "bg-blue-100 text-blue-700", icon: "📞" },
  prosba_o_kontakt: { label: "Prośba o kontakt", color: "bg-amber-100 text-amber-700", icon: "🔔" },
  spam: { label: "SPAM", color: "bg-red-100 text-red-600", icon: "🚫" },
  zamowienie: { label: "Zamówienie", color: "bg-green-100 text-green-700", icon: "🛒" },
  pytanie_o_cene: { label: "Pytanie o cenę", color: "bg-teal-100 text-teal-700", icon: "💰" },
  inna: { label: "Inne", color: "bg-brand-50 text-zinc-600", icon: "📋" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "Nowy", color: "bg-blue-100 text-blue-700" },
  processed: { label: "W trakcie", color: "bg-amber-100 text-amber-700" },
  active: { label: "Aktywny", color: "bg-green-100 text-green-600" },
  trashed: { label: "Kosz", color: "bg-red-100 text-red-500" },
};

export default function AdminLeadsTable({ onRefresh, onActivate, leads }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LeadType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "company_name" | "type">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"active" | "trashed">("active");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const filtered = leads
    .filter(l => {
      if (view === "active") return l.status !== "trashed";
      return l.status === "trashed";
    })
    .filter(l => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return l.company_name.toLowerCase().includes(q)
        || l.phone?.includes(q)
        || l.contact_email?.toLowerCase().includes(q)
        || l.message?.toLowerCase().includes(q)
        || l.industry?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortBy === "company_name") cmp = a.company_name.localeCompare(b.company_name);
      else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  async function handleBatch(action: string) {
    const ids = [...checked];
    if (action === "trash") {
      await Promise.all(ids.map(id =>
        fetch("/api/admin/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "trashed" }),
        })
      ));
    } else if (action === "restore") {
      await Promise.all(ids.map(id =>
        fetch("/api/admin/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "new" }),
        })
      ));
    } else if (action === "spam") {
      await Promise.all(ids.map(id =>
        fetch("/api/admin/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, type: "spam" }),
        })
      ));
    } else if (action === "delete") {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/leads?id=${id}`, { method: "DELETE" })
      ));
    }
    setChecked(new Set());
    onRefresh();
  }

  async function handleActivate(lead: Lead) {
    setActivating(lead.id);
    await onActivate(lead.id, generateDefaultPrompt(lead));
    setActivating(null);
  }

  function toggleCheck(id: string) {
    setChecked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function toggleAll() {
    if (checked.size === filtered.length && filtered.length > 0) setChecked(new Set());
    else setChecked(new Set(filtered.map(l => l.id)));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Szukaj leadów..."
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as LeadType | "all")} className="px-3 py-2 border border-zinc-200 rounded-lg text-sm">
            <option value="all">Wszystkie typy</option>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <button onClick={() => { setView("active"); setChecked(new Set()); }} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${view === "active" ? "bg-[#ccfbf1] text-[#0d9488]" : "text-zinc-500 hover:text-zinc-700"}`}>
            Aktywne ({leads.filter(l => l.status !== "trashed").length})
          </button>
          <button onClick={() => { setView("trashed"); setChecked(new Set()); }} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${view === "trashed" ? "bg-red-100 text-red-600" : "text-zinc-500 hover:text-zinc-700"}`}>
            Kosz ({leads.filter(l => l.status === "trashed").length})
          </button>
          <div className="flex gap-1 ml-2">
            {[
              { key: "created_at", label: "Data" },
              { key: "company_name", label: "Nazwa" },
              { key: "type", label: "Typ" },
            ].map(s => (
              <button key={s.key} onClick={() => handleSort(s.key as typeof sortBy)} className={`px-2.5 py-1.5 text-xs rounded-lg transition ${sortBy === s.key ? "bg-[#ccfbf1] text-[#0d9488] font-medium" : "text-zinc-500 hover:text-zinc-700"}`}>
                {s.label} {sortBy === s.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batch actions */}
      {checked.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 rounded-xl px-4 py-3">
          <span className="text-sm text-zinc-700 font-medium">Wybrano {checked.size}</span>
          {view === "active" ? (
            <>
              <button onClick={() => handleBatch("trash")} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">Przenieś do kosza</button>
              <button onClick={() => handleBatch("spam")} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">Oznacz jako SPAM</button>
            </>
          ) : (
            <>
              <button onClick={() => handleBatch("restore")} className="text-xs px-3 py-1.5 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition">Przywróć</button>
              <button onClick={() => handleBatch("delete")} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">Usuń na stałe</button>
            </>
          )}
          <button onClick={() => setChecked(new Set())} className="text-xs text-zinc-500 hover:text-zinc-700">Anuluj</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><p className="text-sm text-zinc-400">{view === "trashed" ? "Kosz jest pusty" : "Brak leadów"}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left">
                  <th className="px-3 py-2.5 w-10">
                    <input type="checkbox" checked={checked.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[#0d9488] rounded" />
                  </th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Lead</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Typ</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Kontakt</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Zainteresowanie</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Data</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase whitespace-nowrap">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} onClick={() => setDetailLead(l)} className={`border-b border-zinc-50 hover:bg-[#f0fdfa]/50 transition-colors cursor-pointer ${l.status === "trashed" ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.has(l.id)} onChange={() => toggleCheck(l.id)} className="accent-[#0d9488] rounded" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-zinc-900">{l.company_name}</div>
                      {l.message && <div className="text-xs text-zinc-500 line-clamp-1 max-w-[200px]">{l.message}</div>}
                      {l.knowledge_base_raw && !l.message && <div className="text-xs text-zinc-400 line-clamp-1 max-w-[200px]">{l.knowledge_base_raw}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig[l.type]?.color || typeConfig.inna.color}`}>
                        {typeConfig[l.type]?.icon} {typeConfig[l.type]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[l.status]?.color || "bg-brand-50 text-zinc-600"}`}>
                        {statusConfig[l.status]?.label || l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {l.phone && <span className="text-xs font-mono text-zinc-600">{l.phone}</span>}
                        {l.contact_email && <span className="text-xs text-zinc-400">{l.contact_email}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-zinc-500">{l.industry || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {l.status === "trashed" && view === "trashed" ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleBatch("restore")} className="text-xs px-2 py-1 rounded bg-[#ccfbf1] text-[#0d9488] hover:bg-[#0d9488]/20">Przywróć</button>
                        </div>
                      ) : l.type === "zgloszenie_firmy" && l.status !== "active" ? (
                        <button
                          onClick={() => handleActivate(l)}
                          disabled={activating === l.id}
                          className="text-xs px-2 py-1 rounded bg-[#0d9488] text-white hover:bg-[#0f766e] disabled:opacity-50 transition"
                        >
                          {activating === l.id ? "..." : "Aktywuj"}
                        </button>
                      ) : l.status === "active" ? (
                        <span className="text-xs text-green-600 font-medium">Aktywna</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead detail modal */}
      {detailLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetailLead(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">{detailLead.company_name}</h2>
                <button onClick={() => setDetailLead(null)} className="p-2 hover:bg-[#f0fdfa] rounded-lg transition text-lg">✕</button>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[detailLead.type]?.color || typeConfig.inna.color}`}>
                  {typeConfig[detailLead.type]?.icon} {typeConfig[detailLead.type]?.label}
                </span>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[detailLead.status]?.color || "bg-brand-50 text-zinc-600"}`}>
                  {statusConfig[detailLead.status]?.label || detailLead.status}
                </span>
                {detailLead.industry && (
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-zinc-600">
                    {detailLead.industry}
                  </span>
                )}
              </div>

              {/* Contact */}
              <div className="bg-white rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dane kontaktowe</h3>
                {detailLead.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Telefon</span>
                    <a href={`tel:${detailLead.phone}`} className="text-sm font-mono text-[#0d9488] hover:underline">{detailLead.phone}</a>
                  </div>
                )}
                {detailLead.contact_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Email</span>
                    <a href={`mailto:${detailLead.contact_email}`} className="text-sm text-[#0d9488] hover:underline">{detailLead.contact_email}</a>
                  </div>
                )}
                {detailLead.nip && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">NIP</span>
                    <span className="text-sm font-mono text-zinc-700">{detailLead.nip}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Data zgłoszenia</span>
                  <span className="text-sm text-zinc-700">
                    {new Date(detailLead.created_at).toLocaleString("pl-PL", {
                      day: "2-digit", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Message */}
              {detailLead.message && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Wiadomość</h3>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{detailLead.message}</p>
                  </div>
                </div>
              )}

              {/* Knowledge base */}
              {detailLead.knowledge_base_raw && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Baza wiedzy (zgłoszenie)</h3>
                  <div className="bg-white rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap font-mono text-xs">{detailLead.knowledge_base_raw}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-zinc-200 pt-4 flex gap-2">
                {detailLead.type === "zgloszenie_firmy" && detailLead.status !== "active" && (
                  <button
                    onClick={() => { handleActivate(detailLead); }}
                    disabled={activating === detailLead.id}
                    className="flex-1 px-4 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition disabled:opacity-50"
                  >
                    {activating === detailLead.id ? "Aktywowanie..." : "Aktywuj firmę"}
                  </button>
                )}
                {detailLead.status !== "trashed" && (
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: detailLead.id, status: "trashed" }) });
                      setDetailLead(null);
                      onRefresh();
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition"
                  >
                    Przenieś do kosza
                  </button>
                )}
                {detailLead.status === "trashed" && (
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: detailLead.id, status: "new" }) });
                      setDetailLead(null);
                      onRefresh();
                    }}
                    className="flex-1 px-4 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-lg hover:bg-[#0f766e] transition"
                  >
                    Przywróć
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateDefaultPrompt(lead: Lead): string {
  return `Jesteś recepcjonistą AI firmy "${lead.company_name}" z branży "${lead.industry || "usługi"}". Odpowiadaj na pytania klientów wyłącznie na podstawie poniższej bazy wiedzy. Jeśli nie znasz odpowiedzi, grzecznie poinformuj, że przekażesz zapytanie dalej. Zamówienia przyjmuj w sposób uporządkowany. Baza wiedzy:\n${lead.knowledge_base_raw}`;
}
