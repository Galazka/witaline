"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
}

interface OwnerInfo {
  id: string;
  user_id: string;
  role: string;
  email: string;
  is_owner: boolean;
}

export default function SecurityCenter({ businessId }: { businessId: string }) {
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("receptionist");
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState("");
  const supabase = createClient();

  const fetchStaff = async () => {
    setLoading(true);
    const res = await fetch(`/api/business/staff?businessId=${businessId}`);
    if (res.ok) {
      const data = await res.json();
      setOwner(data.owner);
      setStaff(data.staff);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [businessId]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    const res = await fetch("/api/business/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setToast(res.ok ? "Dodano pracownika!" : data.error || "Błąd");
    if (res.ok) { setInviteEmail(""); fetchStaff(); }
    setInviting(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleRemove = async (staffId: string) => {
    if (!confirm("Usunąć dostęp tego pracownika?")) return;
    const res = await fetch(`/api/business/staff/${staffId}?businessId=${businessId}`, { method: "DELETE" });
    setToast(res.ok ? "Usunięto" : "Błąd");
    if (res.ok) fetchStaff();
    setTimeout(() => setToast(""), 3000);
  };

  const handleChangeRole = async (staffId: string, newRole: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const res = await fetch(`/api/business/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, role: newRole }),
    });
    setToast(res.ok ? "Rola zmieniona" : "Błąd");
    if (res.ok) fetchStaff();
    setTimeout(() => setToast(""), 3000);
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    manager: "Menedżer",
    receptionist: "Recepcjonista",
    viewer: "Podgląd",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Centrum bezpieczeństwa</h3>
        <p className="text-sm text-zinc-500">Zarządzaj dostępem pracowników do panelu firmy.</p>
      </div>

      {toast && (
        <div className="bg-brand-50 border border-[#0d9488]/20 text-brand-700 px-4 py-3 rounded-xl text-sm">
          {toast}
        </div>
      )}

      {/* Właściciel */}
      {owner && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-[#0d9488] flex items-center justify-center font-bold text-sm">
                {owner.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{owner.email}</p>
                <p className="text-xs text-zinc-400">Właściciel firmy • pełny dostęp</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#ccfbf1] text-[#065f46] text-xs font-medium">
              Admin
            </span>
          </div>
        </div>
      )}

      {/* Lista pracowników */}
      {loading ? (
        <p className="text-sm text-zinc-400">Ładowanie...</p>
      ) : staff.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-700">Pracownicy</h4>
          {staff.map(m => (
            <div key={m.id} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center font-bold text-sm">
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.email}</p>
                    <p className="text-xs text-zinc-400">
                      Dodany: {new Date(m.invited_at).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.id, e.target.value, e as any)}
                    className="text-xs px-2 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400 italic">Brak pracowników. Dodaj pierwszego poniżej.</p>
      )}

      {/* Dodawanie pracownika */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-zinc-900">Dodaj pracownika</h4>
        <p className="text-xs text-zinc-400">Pracownik musi mieć konto w WitaLine (zarejestrować się).</p>
        <div className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@pracownika.pl"
            className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
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
            disabled={inviting || !inviteEmail}
            className="bg-[#0d9488] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0f766e] transition disabled:opacity-50"
          >
            {inviting ? "..." : "Dodaj"}
          </button>
        </div>
        <div className="text-xs text-zinc-400 space-y-1">
          <p><strong>Menedżer</strong> — zarządza rezerwacjami, podgląda statystyki i ustawienia</p>
          <p><strong>Recepcjonista</strong> — tworzy i edytuje rezerwacje, widzi historię rozmów</p>
          <p><strong>Podgląd</strong> — tylko odczyt rozmów i rezerwacji</p>
        </div>
      </div>
    </div>
  );
}
