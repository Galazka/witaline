"use client";

import { useState } from "react";
import type { Lead, LeadType } from "@/types/database";

interface Props {
  lead: Lead;
  onStatusChange: () => void;
  onActivate: (id: string, systemPrompt: string) => void;
}

const inputClass =
  "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] placeholder:text-zinc-400 transition";

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  processed: "bg-amber-100 text-amber-800",
  active: "bg-brand-100 text-[#0d9488]",
};

const statusLabels: Record<string, string> = {
  new: "Nowy",
  processed: "W trakcie",
  active: "Aktywny",
};

const typeConfig: Record<LeadType, { label: string; color: string; icon: string }> = {
  zgloszenie_firmy: { label: "Zgłoszenie firmy", color: "bg-purple-100 text-purple-700", icon: "🏢" },
  kontakt: { label: "Kontakt tel.", color: "bg-blue-100 text-blue-700", icon: "📞" },
  prosba_o_kontakt: { label: "Prośba o kontakt", color: "bg-amber-100 text-amber-700", icon: "🔔" },
  spam: { label: "SPAM", color: "bg-red-100 text-red-600", icon: "🚫" },
  zamowienie: { label: "Zamówienie", color: "bg-green-100 text-green-700", icon: "🛒" },
  pytanie_o_cene: { label: "Pytanie o cenę", color: "bg-teal-100 text-teal-700", icon: "💰" },
  inna: { label: "Inne", color: "bg-brand-50 text-zinc-600", icon: "📋" },
};

export default function AdminLeadCard({ lead, onStatusChange, onActivate }: Props) {
  const [activating, setActivating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const leadType = typeConfig[lead.type] || typeConfig.inna;

  async function handleActivate() {
    setActivating(true);
    await onActivate(lead.id, prompt);
    setActivating(false);
  }

  async function handleMarkSpam() {
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, type: "spam" }),
    });
    onStatusChange();
  }

  async function handleDeactivate() {
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: "processed", type: "zgloszenie_firmy" }),
    });
    onStatusChange();
  }

  function generateDefaultPrompt(): string {
    return `Jesteś recepcjonistą AI firmy "${lead.company_name}" z branży "${lead.industry || "usługi"}". Odpowiadaj na pytania klientów wyłącznie na podstawie poniższej bazy wiedzy. Jeśli nie znasz odpowiedzi, grzecznie poinformuj, że przekażesz zapytanie dalej. Zamówienia przyjmuj w sposób uporządkowany. Baza wiedzy:\n${lead.knowledge_base_raw}`;
  }

  const isCompanyRegistration = lead.type === "zgloszenie_firmy";
  const isFromCall = lead.type === "kontakt" || lead.type === "prosba_o_kontakt" || lead.type === "pytanie_o_cene";

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
      {/* Header with type badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {isFromCall ? (
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-lg shrink-0">
              {leadType.icon}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg shrink-0">
              {leadType.icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 truncate">{lead.company_name}</h3>
            {isCompanyRegistration ? (
              <p className="text-sm text-zinc-500 truncate">NIP: {lead.nip || "—"} | {lead.industry || "Brak branży"}</p>
            ) : (
              <p className="text-sm text-zinc-500 truncate">{lead.phone ? `📞 ${lead.phone}` : ""} {lead.contact_email ? `✉️ ${lead.contact_email}` : ""}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig[lead.type]?.color || typeConfig.inna.color}`}>
            {leadType.icon} {leadType.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusStyles[lead.status]}`}>
            {statusLabels[lead.status]}
          </span>
        </div>
      </div>

      {/* Registration fields - only for company registration */}
      {isCompanyRegistration && (
        <>
          {lead.nip && <p className="text-sm text-zinc-600"><span className="font-medium text-zinc-700">NIP:</span> {lead.nip}</p>}
          <p className="text-sm text-zinc-600"><span className="font-medium text-zinc-700">Email:</span> {lead.contact_email}</p>
          {lead.phone && <p className="text-sm text-zinc-600"><span className="font-medium text-zinc-700">Telefon:</span> {lead.phone}</p>}
        </>
      )}

      {/* Contact fields - for call leads */}
      {isFromCall && (
        <>
          <p className="text-sm text-zinc-600"><span className="font-medium text-zinc-700">Zainteresowanie:</span> {lead.industry || "ogólne"}</p>
          {lead.contact_email && <p className="text-sm text-zinc-600"><span className="font-medium text-zinc-700">Email:</span> {lead.contact_email}</p>}
        </>
      )}

      {/* Message / knowledge base */}
      {lead.message && (
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Wiadomość</p>
          <p className="text-sm text-zinc-700 bg-blue-50 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">{lead.message}</p>
        </div>
      )}

      {lead.knowledge_base_raw && !lead.message && (
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Notatka</p>
          <p className="text-sm text-zinc-700 bg-white rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">{lead.knowledge_base_raw}</p>
        </div>
      )}

      <p className="text-xs text-zinc-400">Utworzono: {new Date(lead.created_at).toLocaleString("pl-PL")}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isCompanyRegistration && lead.status !== "active" && (
          <div className="w-full space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={generateDefaultPrompt()}
              className={inputClass}
              rows={4}
            />
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full bg-[#0d9488] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
            >
              {activating ? "Aktywowanie..." : "Aktywuj firmę"}
            </button>
          </div>
        )}

        {lead.status === "active" && (
          <button onClick={handleDeactivate} className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
            Dezaktywuj
          </button>
        )}

        {lead.type !== "spam" && (
          <button onClick={handleMarkSpam} className="px-4 py-2 text-sm font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition">
            Oznacz jako SPAM
          </button>
        )}
      </div>
    </div>
  );
}
