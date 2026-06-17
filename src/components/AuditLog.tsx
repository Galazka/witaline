"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

interface Props {
  businessId: string;
}

const ACTION_LABELS: Record<string, string> = {
  update_name: "Zmienił nazwę",
  update_system_prompt: "Zmienił prompt",
  update_voice_id: "Zmienił głos",
  update_current_plan: "Zmienił plan",
  update_industry: "Zmienił branżę",
  update_website_url: "Zmienił stronę www",
  update_phone: "Zmienił telefon",
  update_twilio_number: "Zmienił numer Twilio",
  update_menu_catalog: "Zmienił katalog",
  update_nip: "Zmienił NIP",
  update_krs: "Zmienił KRS",
  invite_member: "Zaprosił członka",
  remove_member: "Usunął członka",
  update_member_role: "Zmienił rolę",
  verification_submitted: "Złożył wniosek weryfikacyjny",
  verification_verified: "Zweryfikował firmę",
  verification_rejected: "Odrzucił weryfikację",
  login: "Zalogował się",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nazwa",
  system_prompt: "Prompt",
  voice_id: "Głos",
  current_plan: "Plan",
  industry: "Branża",
  website_url: "Strona www",
  phone: "Telefon",
  twilio_number: "Numer Twilio",
  menu_catalog: "Katalog",
  nip: "NIP",
  krs: "KRS",
  role: "Rola",
  members: "Członkowie",
  verification_status: "Weryfikacja",
};

export default function AuditLog({ businessId }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/business/audit?businessId=${businessId}&limit=${pageSize}&offset=${page * pageSize}`
      );
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {}
    setLoading(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Dziennik zmian</h3>
        <button onClick={fetchLogs} className="text-xs text-brand-500 hover:underline">Odśwież</button>
      </div>

      {loading ? (
        <p className="text-xs text-zinc-400">Ładowanie...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-4">Brak wpisów</p>
      ) : (
        <div className="space-y-1">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 py-2 px-3 hover:bg-brand-50 rounded-lg transition">
              <div className="w-1.5 h-1.5 bg-brand-200 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700">
                  <span className="font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                  {log.field_name && (
                    <span className="text-zinc-500"> — {FIELD_LABELS[log.field_name] || log.field_name}</span>
                  )}
                </p>
                {log.old_value && log.new_value && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    <span className="line-through">{log.old_value.slice(0, 50)}</span>
                    {" → "}
                    <span className="text-zinc-600">{log.new_value.slice(0, 50)}</span>
                  </p>
                )}
                {!log.old_value && log.new_value && (
                  <p className="text-xs text-zinc-400 mt-0.5">{log.new_value.slice(0, 80)}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-zinc-400">{formatTime(log.created_at)}</p>
                {log.ip_address && log.ip_address !== "unknown" && (
                  <p className="text-[10px] text-zinc-300">{log.ip_address}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {logs.length === pageSize && (
        <div className="flex justify-center">
          <button
            onClick={() => { setPage(p => p + 1); fetchLogs(); }}
            className="text-xs text-brand-500 hover:underline"
          >
            Następna strona
          </button>
        </div>
      )}
    </div>
  );
}
