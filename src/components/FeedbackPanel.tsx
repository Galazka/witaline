"use client";

import type { Feedback } from "@/types/database";

interface Props {
  feedback: Feedback[];
  loading: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-sm ${star <= rating ? "text-amber-400" : "text-zinc-200"}`}>★</span>
      ))}
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  general: "Ogólne",
  service: "Obsługa",
  booking: "Rezerwacja",
  support: "Wsparcie",
  complaint: "Reklamacja",
};

const categoryColors: Record<string, string> = {
  general: "bg-brand-50 text-zinc-600",
  service: "bg-brand-100 text-brand-500",
  booking: "bg-blue-100 text-blue-800",
  support: "bg-amber-100 text-amber-800",
  complaint: "bg-red-100 text-red-800",
};

export default function FeedbackPanel({ feedback, loading }: Props) {
  if (loading) return <p className="text-sm text-zinc-400">Ładowanie...</p>;

  if (feedback.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center">
        <p className="text-sm text-zinc-400">Brak opinii od klientów</p>
      </div>
    );
  }

  const avgRating = feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length;
  const distribution = [0, 0, 0, 0, 0];
  feedback.forEach((f) => { distribution[5 - f.rating]++; });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Średnia ocena</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-zinc-900">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">z {feedback.length} opinii</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Rozkład ocen</p>
          <div className="space-y-1.5">
            {distribution.map((count, i) => {
              const star = 5 - i;
              const pct = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-zinc-400">{star}★</span>
                  <div className="flex-1 h-2 bg-brand-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {feedback.map((f) => (
          <div key={f.id} className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StarRating rating={f.rating} />
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[f.category] || "bg-brand-50 text-zinc-600"}`}>
                  {categoryLabels[f.category] || f.category}
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(f.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {f.comment && <p className="text-sm text-zinc-700">{f.comment}</p>}
            {f.caller_phone && <p className="text-xs text-zinc-400 mt-1">{f.caller_phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}




