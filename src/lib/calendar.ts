import { supabaseAdmin } from "./supabase-admin";
import { sendSms } from "./twilio-sms";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ── Atomic booking with double-booking prevention ──────────────
export async function createBooking(params: {
  businessId: string;
  reservedAt: string;
  serviceType: string;
  callerName: string;
  callerPhone?: string;
  notes?: string;
  durationMinutes?: number;
  createdByType?: "ai_agent" | "admin" | "staff" | "client";
  createdByUserId?: string;
}): Promise<{ ok: true; reservation: Record<string, unknown> } | { ok: false; error: string }> {
  const { businessId, reservedAt, serviceType, callerName, callerPhone, notes } = params;
  const duration = params.durationMinutes || 30;
  const createdByType = params.createdByType || "ai_agent";
  const createdByUserId = params.createdByUserId || null;

  // Verify the slot is actually available (atomic check)
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("calendar_settings, name, twilio_number")
    .eq("id", businessId)
    .single();

  if (!biz) return { ok: false, error: "Nie znaleziono firmy." };

  // Check for conflicting reservation
  const { data: conflicts } = await supabaseAdmin
    .from("reservations")
    .select("id, reserved_at, duration_minutes")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .gte("reserved_at", new Date(new Date(reservedAt).getTime() - duration * 60000).toISOString())
    .lte("reserved_at", new Date(new Date(reservedAt).getTime() + duration * 60000).toISOString());

  if (conflicts && conflicts.length > 0) {
    return { ok: false, error: "Ten termin jest już zajęty. Wybierz inną godzinę." };
  }

  // Create the reservation
  const { data: reservation, error } = await supabaseAdmin
    .from("reservations")
    .insert({
      business_id: businessId,
      reserved_at: reservedAt,
      service_type: serviceType,
      caller_name: callerName,
      caller_phone: callerPhone || "",
      notes: notes || "",
      status: "pending",
      duration_minutes: duration,
      created_by_type: createdByType,
      created_by_user_id: createdByUserId,
    })
    .select("id, reserved_at, service_type, caller_name, caller_phone, status, duration_minutes")
    .single();

  if (error) {
    // Check for unique constraint violation (double-booking)
    if (error.message?.includes("idx_reservations_unique_active")) {
      return { ok: false, error: "Ktoś właśnie zarezerwował ten termin. Wybierz inną godzinę." };
    }
    return { ok: false, error: `Błąd rezerwacji: ${error.message}` };
  }

  // Send confirmation SMS (with SMS limit check)
  if (reservation.caller_phone) {
    sendConfirmationSms(reservation.caller_phone, {
      serviceType,
      reservedAt,
      businessName: biz.name || "",
    }, businessId).catch((e) => console.warn("[calendar] error:", e));
  }

  // Sync to Google Calendar if connected
  syncToGoogleCalendar(businessId, {
    id: reservation.id,
    summary: `${serviceType} - ${callerName}`,
    startDateTime: reservedAt,
    endDateTime: new Date(new Date(reservedAt).getTime() + duration * 60000).toISOString(),
    description: `Klient: ${callerName}\nTelefon: ${callerPhone || "—"}\nNotatki: ${notes || "—"}`,
  }).catch((e) => console.warn("[calendar] error:", e));

  return { ok: true, reservation };
}

// ── SMS confirmation (with SMS limit checking) ────────────────
async function sendConfirmationSms(to: string, info: { serviceType: string; reservedAt: string; businessName: string }, businessId: string) {
  const date = new Date(info.reservedAt).toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const message =
    `✅ WitaLine — potwierdzenie rezerwacji\n` +
    `Usługa: ${info.serviceType}\n` +
    `Termin: ${date}\n` +
    `Firma: ${info.businessName}\n\n` +
    `Dziękujemy! W razie potrzeby prosimy o kontakt.`;

  await sendSms(to, message, undefined, businessId);
}

// ── Google Calendar sync ──────────────────────────────────────
async function refreshGoogleToken(token: {
  access_token: string; refresh_token: string; expires_at: string; business_id: string
}): Promise<string | null> {
  if (new Date(token.expires_at).getTime() > Date.now() + 60000) return token.access_token;
  if (!token.refresh_token || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: token.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  await supabaseAdmin.from("calendar_tokens").update({
    access_token: data.access_token,
    expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
  }).eq("business_id", token.business_id);

  return data.access_token;
}

async function syncToGoogleCalendar(businessId: string, event: {
  id: string; summary: string; startDateTime: string; endDateTime: string; description: string
}) {
  const { data: token } = await supabaseAdmin
    .from("calendar_tokens")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (!token) return;
  const accessToken = await refreshGoogleToken(token);
  if (!accessToken) return;

  await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startDateTime, timeZone: "Europe/Warsaw" },
      end: { dateTime: event.endDateTime, timeZone: "Europe/Warsaw" },
    }),
  });
}

// ── Check availability with next-available suggestions ─────────
export async function checkAvailability(businessId: string, date: string): Promise<{
  available: boolean; slots: { time: string; label: string }[]; nextDates?: string[]
}> {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = new Date(date).getDay();
  const dayKey = dayNames[dayIndex];

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("calendar_settings")
    .eq("id", businessId)
    .single();

  if (!biz) return { available: false, slots: [] };

  const cal = biz.calendar_settings as Record<string, unknown>;
  const dayConf = cal[dayKey] as { enabled?: boolean; start?: string; end?: string } | undefined;

  if (!dayConf?.enabled) {
    // Find next available dates
    const nextDates = findNextAvailableDates(cal, date, 5);
    return { available: false, slots: [], nextDates };
  }

  const interval = (cal.slot_interval as number) || 30;
  const [startH, startM] = (dayConf.start || "09:00").split(":").map(Number);
  const [endH, endM] = (dayConf.end || "17:00").split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

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
      for (let m = start; m < end; m++) bookedMinutes.add(m);
    }
  }

  const slots: { time: string; label: string }[] = [];
  for (let m = startMin; m + interval <= endMin; m += interval) {
    let isBooked = false;
    for (let b = m; b < m + interval; b++) {
      if (bookedMinutes.has(b)) { isBooked = true; break; }
    }
    if (!isBooked) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      slots.push({ time, label: `${time} - ${String(Math.floor((m + interval) / 60)).padStart(2, "0")}:${String((m + interval) % 60).padStart(2, "0")}` });
    }
  }

  if (slots.length === 0) {
    const nextDates = findNextAvailableDates(cal, date, 5);
    return { available: false, slots: [], nextDates };
  }

  return { available: true, slots };
}

function findNextAvailableDates(cal: Record<string, unknown>, fromDate: string, limit: number): string[] {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const result: string[] = [];
  const start = new Date(fromDate);

  for (let i = 1; i <= 30 && result.length < limit; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayKey = dayNames[d.getDay()];
    const dayConf = cal[dayKey] as { enabled?: boolean } | undefined;
    if (dayConf?.enabled) {
      result.push(d.toISOString().slice(0, 10));
    }
  }
  return result;
}

// ── SMS reminders for upcoming reservations ───────────────────
export async function sendUpcomingReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("id, caller_name, caller_phone, service_type, reserved_at, business_id, sms_reminder_sent")
    .in("status", ["pending", "confirmed"])
    .eq("sms_reminder_sent", false)
    .gte("reserved_at", now.toISOString())
    .lte("reserved_at", in24h.toISOString());

  if (!reservations) return;

  for (const r of reservations) {
    if (!r.caller_phone) continue;

    const date = new Date(r.reserved_at).toLocaleDateString("pl-PL", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
    });

    const message = `⏰ WitaLine — przypomnienie o wizycie\n${r.service_type}\n${date}\n\nDo zobaczenia!`;

    await sendSms(r.caller_phone, message, undefined, r.business_id);

    await supabaseAdmin.from("reservations").update({ sms_reminder_sent: true }).eq("id", r.id);
  }
}
