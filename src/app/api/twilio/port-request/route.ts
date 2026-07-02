import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WITALINE_MAIN_BUSINESS_ID } from "@/lib/constants";

/** Zgłoszenie przeniesienia numeru przez firmę */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, phoneNumber, accountName, nip } = body;

  if (!businessId || !phoneNumber || !accountName) {
    return NextResponse.json({ error: "Wymagane: businessId, phoneNumber, accountName" }, { status: 400 });
  }

  // Sprawdź czy firma należy do usera
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, owner_uid")
    .eq("id", businessId)
    .eq("owner_uid", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Nie znaleziono firmy" }, { status: 404 });
  }

  // Sprawdź czy nie ma już pending request
  const { data: existing } = await supabaseAdmin
    .from("port_requests")
    .select("id, status")
    .eq("business_id", businessId)
    .eq("phone_number", phoneNumber)
    .in("status", ["pending", "in_progress"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      error: "Istnieje już aktywne zgłoszenie dla tego numeru.",
      existingId: existing.id,
    }, { status: 409 });
  }

  // Zapisz zgłoszenie
  const { data, error } = await supabaseAdmin
    .from("port_requests")
    .insert({
      business_id: businessId,
      phone_number: phoneNumber,
      account_name: accountName,
      nip: nip || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Utwórz powiadomienie dla admina
  await supabaseAdmin.from("notifications").insert({
    business_id: WITALINE_MAIN_BUSINESS_ID,
    type: "system",
    title: "Nowe zgłoszenie przeniesienia numeru",
    message: `Firma zgłosiła chęć przeniesienia numeru ${phoneNumber}. Oczekuje na rozpatrzenie.`,
  }).maybeSingle();

  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}

/** Admin: lista zgłoszeń */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Tylko admin
  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("port_requests")
    .select("*, businesses(name, twilio_number, owner_uid)")
    .order("created_at", { ascending: false });

  if (status && ["pending", "in_progress", "completed", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

/** Admin: aktualizacja statusu zgłoszenia */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status, admin_note } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (admin_note !== undefined) updates.admin_note = admin_note;

  const { data, error } = await supabaseAdmin
    .from("port_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}