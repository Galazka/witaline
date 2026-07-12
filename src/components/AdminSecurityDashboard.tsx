"use client";

import { useState, useEffect } from "react";

interface AuditEntry {
  id: string;
  business_id: string;
  business_name: string;
  user_id: string;
  user_email: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

interface Anomaly {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  businessId: string;
  businessName: string;
  description: string;
  createdAt: string;
  flagged: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  update_name: "Zmiana nazwy",
  update_system_prompt: "Zmiana promptu",
  update_voice_id: "Zmiana głosu",
  update_current_plan: "Zmiana planu",
  update_industry: "Zmiana branży",
  update_website_url: "Zmiana strony",
  update_phone: "Zmiana telefonu",
  update_twilio_number: "Zmiana numeru",
  update_nip: "Zmiana NIP",
  update_krs: "Zmiana KRS",
  invite_member: "Zaproszenie członka",
  remove_member: "Usunięcie członka",
  update_member_role: "Zmiana roli",
  verification_submitted: "Wniosek weryfikacyjny",
  verification_verified: "Weryfikacja OK",
  verification_rejected: "Odrzucenie weryfikacji",
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "KRYTYCZNY", color: "text-red-700", bg: "bg-red-100" },
  high: { label: "WYSOKI", color: "text-orange-700", bg: "bg-orange-100" },
  medium: { label: "ŚREDNI", color: "text-amber-700", bg: "bg-amber-100" },
  low: { label: "NISKI", color: "text-zinc-500", bg: "bg-brand-50" },
};

export default function AdminSecurityDashboard() {
  const [tab, setTab] = useState<"anomalies" | "audit" | "stats">("anomalies");
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [anomRes, auditRes] = await Promise.all([
        fetch("/api/admin/anomalies?limit=50"),
        fetch("/api/admin/audit?limit=100&flags=true"),
      ]);

      if (anomRes.ok) {
        const data = await anomRes.json();
        setAnomalies(data.anomalies || []);
        setFlaggedCount(data.flagged || 0);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setLogs(data.logs || []);
      }
    } catch {}
    setLoading(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Bezpieczeństwo platformy</h2>
          <p className="text-xs text-zinc-500">Monitoring zmian, anomalii i audit log</p>
        </div>
        <button onClick={fetchAll} className="btn-ghost text-xs">Odśwież</button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        <div className="card-kpi">
          <p className="text-[10px] text-zinc-400 uppercase">Flagi</p>
          <p className="text-2xl font-bold text-red-500">{flaggedCount}</p>
          <p className="text-[10px] text-zinc-400">wymaga przeglądu</p>
        </div>
        <div className="card-kpi">
          <p className="text-[10px] text-zinc-400 uppercase">Anomalie (7 dni)</p>
          <p className="text-2xl font-bold text-amber-600">{anomalies.length}</p>
          <p className="text-[10px] text-zinc-400">wykryte zmiany</p>
        </div>
        <div className="card-kpi">
          <p className="text-[10px] text-zinc-400 uppercase">Krytyczne</p>
          <p className="text-2xl font-bold text-red-700">{anomalies.filter(a => a.severity === "critical").length}</p>
          <p className="text-[10px] text-zinc-400">pilne do sprawdzenia</p>
        </div>
        <div className="card-kpi">
          <p className="text-[10px] text-zinc-400 uppercase">Wpisy audit</p>
          <p className="text-2xl font-bold text-zinc-900">{logs.length}</p>
          <p className="text-[10px] text-zinc-400">ostatnie zmiany</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-50 p-1 rounded-xl">
        {([
          ["anomalies", `🚨 Anomalie (${anomalies.filter(a => a.flagged).length})`],
          ["audit", `📋 Audit Log (${logs.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
              tab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Ładowanie...</p>
      ) : (
        <>
          {/* Anomalies tab */}
          {tab === "anomalies" && (
            <div className="space-y-2">
              {anomalies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-500">Brak anomalii — wszystko OK</p>
                </div>
              ) : (
                anomalies.map(a => {
                  const sev = SEVERITY_CONFIG[a.severity];
                  return (
                    <div key={a.id} className={`card-modern p-4 ${a.flagged ? "border-l-4 border-l-red-400" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                              {sev.label}
                            </span>
                            <span className="text-[10px] text-zinc-400">{a.type.replace(/_/g, " ")}</span>
                          </div>
                          <p className="text-sm text-zinc-900 font-medium">{a.description}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Firma: <span className="font-medium">{a.businessName}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-zinc-400">{formatTime(a.createdAt)}</p>
                          {a.flagged && (
                            <span className="inline-block text-[10px] text-red-500 mt-1">🚩 Flaga</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Audit log tab */}
          {tab === "audit" && (
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">Brak wpisów</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 px-3 hover:bg-[#f0fdfa] rounded-lg transition">
                    <div className="w-1.5 h-1.5 bg-brand-200 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700">
                        <span className="font-medium text-[#0d9488]">{log.business_name}</span>
                        {" · "}
                        <span>{log.user_email}</span>
                        {" · "}
                        <span>{ACTION_LABELS[log.action] || log.action}</span>
                      </p>
                      {log.old_value && log.new_value && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          <span className="line-through">{log.old_value.slice(0, 40)}</span>
                          {" → "}
                          <span className="text-zinc-600">{log.new_value.slice(0, 40)}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-zinc-400">{formatTime(log.created_at)}</p>
                      {log.ip_address && log.ip_address !== "unknown" && (
                        <p className="text-[10px] text-zinc-300 font-mono">{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
