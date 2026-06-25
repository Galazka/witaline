"use client";

import type { Reservation } from "@/types/database";

interface Props {
  reservations: Reservation[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (day: number) => void;
}

const DAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const SOURCE_BADGE: Record<string, string> = {
  ai_agent: "text-blue-600 bg-blue-50",
  staff: "text-green-600 bg-green-50",
  admin: "text-purple-600 bg-purple-50",
  client: "text-orange-600 bg-orange-50",
};

function SourceBadge({ type }: { type?: string }) {
  const cls = SOURCE_BADGE[type || ""] || "text-zinc-500 bg-zinc-50";
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${cls}`}>{type === "ai_agent" ? "AI" : type === "staff" ? "Ręczna" : type || "—"}</span>;
}

export default function CalendarView({ reservations, year, month, onPrevMonth, onNextMonth, onDayClick }: Props) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const byDay: Record<number, Reservation[]> = {};
  for (const r of reservations) {
    const d = new Date(r.reserved_at);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(r);
    }
  }

  // Sort reservations by time within each day
  for (const day of Object.keys(byDay)) {
    byDay[Number(day)].sort((a, b) => new Date(a.reserved_at).getTime() - new Date(b.reserved_at).getTime());
  }

  const statusDot: Record<string, string> = {
    pending: "bg-amber-400",
    confirmed: "bg-brand-500",
    completed: "bg-brand-400",
    cancelled: "bg-red-400",
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="text-zinc-400 hover:text-zinc-600 transition text-lg px-2">
          ‹
        </button>
        <h3 className="text-lg font-semibold text-zinc-900">
          {MONTHS[month]} {year}
        </h3>
        <button onClick={onNextMonth} className="text-zinc-400 hover:text-zinc-600 transition text-lg px-2">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-brand-100 rounded-xl overflow-hidden">
        {DAYS.map((d) => (
          <div key={d} className="bg-white text-center text-xs font-medium text-zinc-400 py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const isToday =
            day &&
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const dayReservations = day ? byDay[day] || [] : [];

          return (
            <div
              key={i}
              className={`bg-white min-h-[90px] p-1.5 ${day ? "cursor-pointer hover:bg-green-50/50 transition-colors" : "bg-white/50"}`}
              onClick={() => day && onDayClick?.(day)}
            >
              {day && (
                <>
                  <div
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-brand-400 text-white" : "text-zinc-500"
                    }`}
                  >
                    {day}
                  </div>
                  {dayReservations.length > 0 && (
                    <div className="space-y-1">
                      {dayReservations.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1 text-[10px] leading-tight group relative"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[r.status] || "bg-brand-200"}`} />
                          <span className="truncate text-zinc-600">
                            {new Date(r.reserved_at).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <SourceBadge type={r.created_by_type} />
                        </div>
                      ))}
                      {dayReservations.length > 4 && (
                        <p className="text-[10px] text-zinc-400 pl-2">
                          +{dayReservations.length - 4} więcej
                        </p>
                      )}
                    </div>
                  )}
                  {dayReservations.length === 0 && (
                    <div className="flex items-center justify-center h-8 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-brand-400">+</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
