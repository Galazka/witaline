import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CalendarDay, Service } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date");

  if (!businessId || !date) {
    return NextResponse.json({ error: "Missing businessId or date" }, { status: 400 });
  }

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("calendar_settings, services")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cal = biz.calendar_settings as Record<string, unknown>;
  const services = (biz.services || []) as Service[];

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = new Date(date).getDay();
  const dayKey = dayNames[dayIndex] as keyof typeof cal;
  const dayConf = cal[dayKey] as CalendarDay | undefined;

  if (!dayConf?.enabled) {
    return NextResponse.json({ slots: [], services, date, available: false });
  }

  const buffer = (cal.buffer_minutes as number) || 15;
  const interval = (cal.slot_interval as number) || 30;

  // Generate time slots
  const slots: { time: string; label: string }[] = [];
  const [startH, startM] = (dayConf.start as string).split(":").map(Number);
  const [endH, endM] = (dayConf.end as string).split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  for (let m = startMin; m + buffer <= endMin; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    slots.push({
      time,
      label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    });
  }

  // Fetch existing reservations for the date to exclude booked slots
  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("reserved_at, duration_minutes")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("reserved_at", `${date}T00:00:00Z`)
    .lte("reserved_at", `${date}T23:59:59Z`);

  const bookedMinutes = new Set<number>();
  if (reservations) {
    for (const r of reservations) {
      const d = new Date(r.reserved_at);
      const start = d.getHours() * 60 + d.getMinutes();
      const end = start + (r.duration_minutes || 30);
      for (let m = start; m < end; m++) {
        bookedMinutes.add(m);
      }
    }
  }

  const available = slots.filter((s) => {
    const [h, m] = s.time.split(":").map(Number);
    const slotMin = h * 60 + m;
    for (let b = slotMin; b < slotMin + interval; b++) {
      if (bookedMinutes.has(b)) return false;
    }
    return true;
  });

  return NextResponse.json({ slots: available, services, date, available: true });
}





