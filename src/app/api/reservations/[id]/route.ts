import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sendSms(to: string, message: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message }),
    }
  );
}

function generateToken(id: string, phone: string): string {
  return crypto
    .createHash("sha256")
    .update(`${id}:${phone}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // If only status/notes change, update directly
  const isTimeChange = body.reserved_at !== undefined || body.duration_minutes !== undefined;
  const isSimpleUpdate = !isTimeChange;

  if (isSimpleUpdate) {
    const allowed = ["status", "notes", "caller_name", "caller_phone", "service_type"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const { data, error } = await supabase
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Time/duration change — need customer confirmation
  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = generateToken(id, reservation.caller_phone || "");
  const oldDate = formatDate(reservation.reserved_at);
  const newDate = formatDate(body.reserved_at || reservation.reserved_at);

  const acceptUrl = `${BASE_URL}/api/reservations/respond/${id}?action=accept&token=${token}`;
  const rejectUrl = `${BASE_URL}/api/reservations/respond/${id}?action=reject&token=${token}`;

  // Store pending change
  await supabaseAdmin
    .from("reservations")
    .update({
      pending_changes: {
        reserved_at: body.reserved_at || reservation.reserved_at,
        duration_minutes: body.duration_minutes || reservation.duration_minutes,
      },
      change_token: token,
      status: "pending",
    })
    .eq("id", id);

  // Notify customer via SMS
  if (reservation.caller_phone) {
    const msg =
      `WitaLine: ${reservation.service_type} zmienia termin z ${oldDate} na ${newDate}. ` +
      `Potwierdź: ${acceptUrl} . Odrzuć: ${rejectUrl}`;
    await sendSms(reservation.caller_phone, msg);
  }

  return NextResponse.json({
    pending: true,
    message: "Wysłano prośbę o potwierdzenie zmiany do klienta",
    oldDate,
    newDate,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
