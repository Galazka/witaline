"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/types/database";

interface Props {
  businessId: string;
}

export default function LeadsView({ businessId }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/leads?businessId=${businessId}`);
        if (res.ok) setLeads(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchLeads();
  }, [businessId]);

  if (loading) return <p className="text-sm text-zinc-400">Ładowanie leadów...</p>;

  if (leads.length === 0) return <p className="text-sm text-zinc-400 italic">Brak zebranych leadów</p>;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
      {leads.map((lead) => (
        <div key={lead.id} className="px-4 py-3 hover:bg-brand-50 transition">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-900">{lead.company_name}</p>
            <span className="text-xs text-zinc-400">{new Date(lead.created_at).toLocaleDateString("pl-PL")}</span>
          </div>
          <div className="flex gap-3 text-xs text-zinc-500 mt-1">
            {lead.phone && <span>📞 {lead.phone}</span>}
            {lead.contact_email && <span>✉️ {lead.contact_email}</span>}
          </div>
          {lead.industry && lead.industry !== "ogólne" && (
            <p className="text-xs text-zinc-400 mt-1">Zainteresowanie: {lead.industry}</p>
          )}
        </div>
      ))}
    </div>
  );
}
