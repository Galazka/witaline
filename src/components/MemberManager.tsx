"use client";

import { useState, useEffect } from "react";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "viewer";
  invited_at: string;
  accepted_at: string | null;
  invite_token: string | null;
  invite_email: string | null;
}

interface Props {
  businessId: string;
  yourRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Właściciel",
  admin: "Administrator",
  viewer: "Przeglądający",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#ccfbf1] text-[#0d9488]",
  admin: "bg-blue-100 text-blue-600",
  viewer: "bg-brand-50 text-zinc-600",
};

export default function MemberManager({ businessId, yourRole }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isOwner = yourRole === "owner";

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/members?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {}
    setLoading(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage("");
    try {
      const res = await fetch("/api/business/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.inviteToken) {
          setMessage("Zaproszenie wygenerowane! Skopiuj link i wyślij go nowemu członkowi.");
        } else {
          setMessage("Członek dodany do zespołu!");
        }
        setInviteEmail("");
        fetchMembers();
      } else {
        setMessage(data.error || "Błąd");
      }
    } catch {
      setMessage("Błąd połączenia");
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm("Usunąć tego członka?")) return;
    const res = await fetch(`/api/business/members?businessId=${businessId}&userId=${userId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchMembers();
  }

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch("/api/business/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, userId, role: newRole }),
    });
    if (res.ok) fetchMembers();
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const activeMembers = members.filter(m => m.accepted_at || m.user_id !== "00000000-0000-0000-0000-000000000000");
  const pendingInvites = members.filter(m => !m.accepted_at && m.user_id === "00000000-0000-0000-0000-000000000000");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900">Członkowie zespołu</h3>

      {loading ? (
        <p className="text-xs text-zinc-400">Ładowanie...</p>
      ) : (
        <>
          {/* Active members */}
          <div className="space-y-2">
            {activeMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-xs font-medium text-zinc-600">
                    {m.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.user_id.slice(0, 8)}...</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role]}`}>
                      {ROLE_LABELS[m.role]}
                    </span>
                  </div>
                </div>
                {isOwner && m.role !== "owner" && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.user_id, e.target.value)}
                      className="text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => handleRemove(m.user_id)} className="text-xs text-red-500 hover:text-red-700">
                      Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Oczekujące zaproszenia</p>
              <div className="space-y-2">
                {pendingInvites.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{m.invite_email || "未知"}</p>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role]}`}>
                          {ROLE_LABELS[m.role]} · Oczekuje
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.invite_token && (
                        <button
                          onClick={() => copyInviteLink(m.invite_token!)}
                          className="text-xs text-[#0d9488] hover:text-[#0f766e] font-medium"
                        >
                          {copiedToken === m.invite_token ? "Skopiowano!" : "Kopiuj link"}
                        </button>
                      )}
                      <button onClick={() => handleRemove(m.user_id)} className="text-xs text-red-500 hover:text-red-700">
                        Anuluj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isOwner && (
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500 mb-2">Zaproś nowego członka</p>
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@firma.pl"
              className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as "admin" | "viewer")}
              className="px-2 py-2 text-sm border border-zinc-200 rounded-xl bg-white"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0d9488] rounded-xl hover:bg-[#0f766e] transition disabled:opacity-50"
            >
              {inviting ? "..." : "Zaproś"}
            </button>
          </div>
          {message && <p className="text-xs text-zinc-500 mt-2">{message}</p>}
        </div>
      )}
    </div>
  );
}
