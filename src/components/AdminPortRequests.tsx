"use client";

import { useState, useEffect, useCallback } from "react";

interface PortRequest {
  id: string;
  business_id: string;
  phone_number: string;
  account_name: string;
  nip: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  admin_note: string;
  created_at: string;
  updated_at: string;
  businesses?: { name: string; twilio_number: string; owner_uid: string };
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Oczekuje",
  in_progress: "W realizacji",
  completed: "Zrealizowane",
  rejected: "Odrzucone",
};

export default function AdminPortRequests() {
  const [requests, setRequests] = useState<PortRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/twilio/port-request${params}`);
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleUpdate(id: string, status: string, adminNote: string) {
    const res = await fetch("/api/twilio/port-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_note: adminNote }),
    });
    if (res.ok) fetchRequests();
  }

  if (loading) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["", "pending", "in_progress", "completed", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${statusFilter === s ? "bg-brand-400 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            {s ? STATUS_LABEL[s] || s : "Wszystkie"}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-zinc-400 italic">Brak zgłoszeń.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <PortRequestCard key={r.id} request={r} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function PortRequestCard({ request, onUpdate }: { request: PortRequest; onUpdate: (id: string, status: string, note: string) => void }) {
  const [note, setNote] = useState(request.admin_note);
  const [selectedStatus, setSelectedStatus] = useState(request.status);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{request.phone_number}</p>
          <p className="text-xs text-zinc-500">{request.account_name}{request.nip ? ` (NIP: ${request.nip})` : ""}</p>
          {request.businesses && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Firma: {request.businesses.name} | Obecny numer: {request.businesses.twilio_number || "brak"}
            </p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[request.status] || "bg-zinc-100 text-zinc-600"}`}>
          {STATUS_LABEL[request.status] || request.status}
        </span>
      </div>

      <p className="text-[10px] text-zinc-400">Utworzono: {new Date(request.created_at).toLocaleString("pl-PL")}</p>

      {/* Admin controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as "pending" | "in_progress" | "completed" | "rejected")}
          className="px-2 py-1 text-xs border border-zinc-200 rounded bg-white"
        >
          <option value="pending">Oczekuje</option>
          <option value="in_progress">W realizacji</option>
          <option value="completed">Zrealizowane</option>
          <option value="rejected">Odrzucone</option>
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notatka admina..." className="flex-1 px-2 py-1 text-xs border border-zinc-200 rounded bg-white" />
        <button onClick={() => onUpdate(request.id, selectedStatus, note)} className="px-3 py-1 text-xs font-medium bg-brand-400 text-white rounded-lg hover:bg-brand-500 transition">
          Aktualizuj
        </button>
      </div>
    </div>
  );
}