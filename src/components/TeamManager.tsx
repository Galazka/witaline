"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  invite_email: string | null;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
  invite_token: string | null;
}

interface OwnerInfo {
  id: string;
  user_id: string;
  role: string;
  email: string;
  is_owner: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Menedżer",
  receptionist: "Recepcjonista",
  viewer: "Podgląd",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  receptionist: "bg-[#ccfbf1] text-[#065f46]",
  viewer: "bg-zinc-100 text-zinc-600",
};

const roleDescriptions: Record<string, string> = {
  admin: "Pełny dostęp do wszystkich funkcji i ustawień",
  manager: "Zarządza rezerwacjami, podgląda statystyki i ustawienia",
  receptionist: "Tworzy i edytuje rezerwacje, widzi historię rozmów i czatów",
  viewer: "Tylko odczyt rozmów, rezerwacji i kosztów",
};

export default function TeamManager({ businessId }: { businessId: string }) {
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("receptionist");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/staff?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        setStaff(data.staff);
      }
    } catch {
      showToast("Błąd ładowania pracowników", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [businessId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;
    setInviting(true);
    try {
      const res = await fetch("/api/business/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.isNewUser
          ? `Utworzono konto i wysłano zaproszenie na ${inviteEmail}`
          : `Dodano ${inviteEmail} jako ${roleLabels[inviteRole].toLowerCase()}`);
        setInviteEmail("");
        fetchStaff();
      } else {
        showToast(data.error || "Błąd zaproszenia", "error");
      }
    } catch {
      showToast("Błąd sieci", "error");
    }
    setInviting(false);
  };

  const handleChangeRole = async (staffId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/business/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, role: newRole }),
      });
      if (res.ok) {
        showToast("Rola zmieniona");
        fetchStaff();
      } else {
        const data = await res.json();
        showToast(data.error || "Błąd", "error");
      }
    } catch {
      showToast("Błąd sieci", "error");
    }
  };

  const handleRemove = async (staffId: string) => {
    if (!confirm("Usunąć tego członka zespołu?")) return;
    try {
      const res = await fetch(`/api/business/staff/${staffId}?businessId=${businessId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Usunięto z zespołu");
        fetchStaff();
      } else {
        showToast("Błąd usuwania", "error");
      }
    } catch {
      showToast("Błąd sieci", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Zespół</h3>
        <p className="text-sm text-zinc-500">Zarządzaj członkami zespołu i ich rolami w panelu firmy.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          toastType === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast}
        </div>
      )}

      {/* Owner card */}
      {owner && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-[#0d9488] flex items-center justify-center font-bold text-sm">
                {owner.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{owner.email}</p>
                <p className="text-xs text-zinc-400">Właściciel firmy</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors.admin}`}>
              {roleLabels.admin}
            </span>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-700">Członkowie zespołu ({staff.length})</h4>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Ładowanie...</p>
          </div>
        ) : staff.length > 0 ? (
          <div className="space-y-2">
            {staff.map((m) => {
              const isPending = !m.accepted_at;
              return (
                <div
                  key={m.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center font-bold text-sm shrink-0">
                        {(m.email || m.invite_email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {m.email || m.invite_email || "Nieznany"}
                          </p>
                          {isPending && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                              Oczekuje
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">
                          {isPending
                            ? `Zaproszony: ${new Date(m.invited_at).toLocaleDateString("pl-PL")}`
                            : `Dołączył: ${new Date(m.accepted_at!).toLocaleDateString("pl-PL")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.id, e.target.value)}
                        className="text-xs px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 cursor-pointer"
                      >
                        {Object.entries(roleLabels).filter(([k]) => k !== "admin").map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Usuń z zespołu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500 mb-1">Brak członków zespołu</p>
            <p className="text-xs text-zinc-400">Zaproś pracowników, aby mogli korzystać z panelu firmy.</p>
          </div>
        )}
      </div>

      {/* Invite form */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">Zaproś członka zespołu</h4>
          <p className="text-xs text-zinc-400 mt-1">
            Wyślij zaproszenie e-mail. Jeśli osoba nie ma konta, zostanie utworzone automatycznie.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@pracownika.pl"
            className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          >
            <option value="manager">Menedżer</option>
            <option value="receptionist">Recepcjonista</option>
            <option value="viewer">Podgląd</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="bg-[#0d9488] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50 shrink-0"
          >
            {inviting ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ...
              </span>
            ) : "Zaproś"}
          </button>
        </div>
        <div className="text-xs text-zinc-400 space-y-1.5">
          {Object.entries(roleDescriptions).map(([key, desc]) => (
            <p key={key}><strong className="text-zinc-500">{roleLabels[key]}</strong> — {desc}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
