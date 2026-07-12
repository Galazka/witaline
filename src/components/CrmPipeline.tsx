"use client";

import { useEffect, useState } from "react";
import type { CallLog, Lead } from "@/types/database";

interface Props {
  businessId: string;
  callLogs: CallLog[];
  onNavigate?: (tab: string) => void;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: "lead" | "caller";
  status: "new" | "contacted" | "booked" | "converted";
  lastInteraction: string;
  interactionCount: number;
  source: string;
  interest?: string;
}

const STAGE_CONFIG = [
  { key: "new" as const, label: "Nowe", color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
  { key: "contacted" as const, label: "Kontakt", color: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
  { key: "booked" as const, label: "Umówione", color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200" },
  { key: "converted" as const, label: "Obsłużone", color: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-200" },
];

function classifyLead(lead: Lead): Contact["status"] {
  if (lead.status === "active") return "converted";
  if (lead.status === "processed") return "contacted";
  return "new";
}

function classifyCall(call: CallLog): Contact["status"] {
  if (call.classification === "order") return "booked";
  if (call.classification === "booking") return "booked";
  if (call.was_helpful === true) return "converted";
  return "contacted";
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dn. temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export default function CrmPipeline({ businessId, callLogs, onNavigate }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leads?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setLeads(data); })
      .catch((e) => console.error("[CrmPipeline] fetch error:", e))
      .finally(() => setLoading(false));
  }, [businessId]);

  const contacts: Contact[] = [];

  leads.forEach(lead => {
    contacts.push({
      id: lead.id,
      name: lead.company_name || "Klient",
      phone: lead.phone,
      email: lead.contact_email || undefined,
      type: "lead",
      status: classifyLead(lead),
      lastInteraction: lead.created_at,
      interactionCount: 1,
      source: "Formularz",
      interest: lead.industry !== "ogólne" ? lead.industry : undefined,
    });
  });

  const callerMap = new Map<string, Contact>();
  callLogs.forEach(call => {
    const key = call.caller_id || "unknown";
    if (key === "unknown") return;
    const existing = callerMap.get(key);
    if (existing) {
      existing.interactionCount++;
      if (new Date(call.created_at) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = call.created_at;
        existing.status = classifyCall(call);
      }
    } else {
      callerMap.set(key, {
        id: call.id,
        name: call.from_number || key,
        phone: key,
        type: "caller",
        status: classifyCall(call),
        lastInteraction: call.created_at,
        interactionCount: 1,
        source: "Telefon",
      });
    }
  });
  contacts.push(...callerMap.values());

  contacts.sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());

  const staged = {
    new: contacts.filter(c => c.status === "new"),
    contacted: contacts.filter(c => c.status === "contacted"),
    booked: contacts.filter(c => c.status === "booked"),
    converted: contacts.filter(c => c.status === "converted"),
  };

  const filtered = activeStage ? contacts.filter(c => c.status === activeStage) : contacts.slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-20 bg-brand-50 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline stages */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveStage(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
            activeStage === null
              ? "bg-brand-950 text-white"
              : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"
          }`}
        >
          Wszystkie ({contacts.length})
        </button>
        {STAGE_CONFIG.map(stage => (
          <button
            key={stage.key}
            onClick={() => setActiveStage(activeStage === stage.key ? null : stage.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
              activeStage === stage.key
                ? `${stage.bgColor} ${stage.textColor} ${stage.borderColor} border`
                : "bg-brand-50 text-zinc-600 hover:bg-[#ccfbf1]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stage.color}`} />
            {stage.label} ({staged[stage.key].length})
          </button>
        ))}
      </div>

      {/* Pipeline columns (desktop) */}
      {!activeStage && contacts.length > 0 && (
        <div className="hidden lg:grid grid-cols-4 gap-3">
          {STAGE_CONFIG.map(stage => (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stage.label}</span>
                <span className="text-xs text-zinc-400">({staged[stage.key].length})</span>
              </div>
              {staged[stage.key].slice(0, 4).map(contact => (
                <ContactCard key={contact.id} contact={contact} compact />
              ))}
              {staged[stage.key].length === 0 && (
                <div className="border border-dashed border-zinc-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-zinc-400">Brak</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact list (mobile / filtered) */}
      <div className="space-y-2">
        {filtered.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-400">Brak kontaktów w tej kategorii</p>
          </div>
        )}
      </div>

      {/* Quick nav */}
      {contacts.length > 0 && !activeStage && (
        <div className="flex justify-center">
          <button
            onClick={() => onNavigate?.("leads")}
            className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium transition"
          >
            Zobacz wszystkie kontakty →
          </button>
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, compact }: { contact: Contact; compact?: boolean }) {
  const stage = STAGE_CONFIG.find(s => s.key === contact.status)!;
  const initials = getInitials(contact.name);

  return (
    <div className={`glass-card rounded-xl p-3 cursor-default ${compact ? "border border-zinc-100" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${stage.color}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-900 truncate">{contact.name}</p>
            {contact.interactionCount > 1 && (
              <span className="text-[10px] bg-brand-50 text-zinc-500 px-1.5 py-0.5 rounded-full font-medium">
                ×{contact.interactionCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-400">{contact.phone}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${stage.bgColor} ${stage.textColor}`}>
              {stage.label}
            </span>
          </div>
          {!compact && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-400">
              <span>{contact.source}</span>
              <span>·</span>
              <span>{timeAgo(contact.lastInteraction)}</span>
              {contact.interest && (
                <>
                  <span>·</span>
                  <span className="text-[#0d9488]">{contact.interest}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
