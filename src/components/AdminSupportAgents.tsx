"use client";

import { useState, useEffect } from "react";

interface SupportAgent {
  id: string;
  user_id: string;
  role: "support" | "admin";
  is_active: boolean;
  created_at: string;
  user: { email: string } | null;
}

export default function AdminSupportAgents() {
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"support" | "admin">("support");

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/support-agents");
      if (res.ok) setAgents(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleAdd = async () => {
    if (!newUserId.trim()) return;
    const res = await fetch("/api/admin/support-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: newUserId.trim(), role: newRole }),
    });
    if (res.ok) {
      setNewUserId("");
      setShowAdd(false);
      fetchAgents();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to add agent");
    }
  };

  const handleToggle = async (agent: SupportAgent) => {
    await fetch("/api/admin/support-agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agent.id, is_active: !agent.is_active }),
    });
    fetchAgents();
  };

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-800">Agenci wsparcia</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-brand-400 text-white rounded-xl text-sm font-medium hover:bg-brand-500 transition"
        >
          {showAdd ? "Anuluj" : "+ Dodaj agenta"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-zinc-50 rounded-xl p-4 mb-6 space-y-3">
          <input
            type="text"
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            placeholder="UUID użytkownika (auth.users)"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as "support" | "admin")}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
          >
            <option value="support">Support</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newUserId.trim()}
            className="px-4 py-2 bg-brand-400 text-white rounded-xl text-sm font-medium hover:bg-brand-500 transition disabled:opacity-50"
          >
            Dodaj
          </button>
        </div>
      )}

      <div className="space-y-2">
        {agents.length === 0 ? (
          <p className="text-sm text-zinc-400">Brak agentów wsparcia</p>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">{agent.user?.email || agent.user_id}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                    agent.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {agent.role}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                    agent.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {agent.is_active ? "aktywny" : "nieaktywny"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggle(agent)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  agent.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {agent.is_active ? "Dezaktywuj" : "Aktywuj"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}