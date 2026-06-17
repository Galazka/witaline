"use client";

import type { Reservation } from "@/types/database";

interface Props {
  reservations: Reservation[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export default function CalendarView({ reservations, year, month, onPrevMonth, onNextMonth }: Props) {
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
          const statuses = [...new Set(dayReservations.map((r) => r.status))];

          return (
            <div
              key={i}
              className={`bg-white min-h-[80px] p-1.5 ${day ? "" : "bg-white/50"}`}
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
                    <div className="space-y-0.5">
                      {dayReservations.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1 text-[10px] leading-tight"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[r.status] || "bg-brand-200"}`} />
                          <span className="truncate text-zinc-600">
                            {new Date(r.reserved_at).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                      {dayReservations.length > 3 && (
                        <p className="text-[10px] text-zinc-400 pl-2">
                          +{dayReservations.length - 3} więcej
                        </p>
                      )}
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




