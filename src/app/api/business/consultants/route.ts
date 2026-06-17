import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPlanConfig } from "@/lib/pricing";
import type { PlanKey } from "@/types/database";

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

const MAX_CONSULTANTS_FALLBACK = 99;

async function getBusinessPlan(businessId: string): Promise<{ plan: PlanKey; maxConsultants: number } | null> {
  const { data } = await supabaseAdmin
    .from("businesses")
    .select("current_plan")
    .eq("id", businessId)
    .single();
  if (!data) return null;
  const plan = data.current_plan as PlanKey;
  try {
    const cfg = getPlanConfig(plan);
    return { plan, maxConsultants: cfg.maxConsultants ?? MAX_CONSULTANTS_FALLBACK };
  } catch {
    return { plan, maxConsultants: MAX_CONSULTANTS_FALLBACK };
  }
}

async function countExistingConsultants(businessId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("business_consultants")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);
  return count ?? 0;
}

/** Pobiera listę konsultantów dla danej firmy */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: consultants, error } = await supabaseAdmin
    .from("business_consultants")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(consultants || []);
}

/** Dodaje nowego konsultanta */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, name, phone } = body;
  if (!businessId || !name || !phone) {
    return NextResponse.json({ error: "Wymagane: businessId, name, phone" }, { status: 400 });
  }

  const cleanedPhone = normalizePhone(phone);
  if (!cleanedPhone) return NextResponse.json({ error: "Nieprawidłowy numer telefonu" }, { status: 400 });

  // Sprawdź limit planu
  const planInfo = await getBusinessPlan(businessId);
  if (!planInfo) return NextResponse.json({ error: "Nie znaleziono firmy" }, { status: 404 });
  const existingCount = await countExistingConsultants(businessId);
  if (existingCount >= planInfo.maxConsultants) {
    return NextResponse.json({
      error: `Osiągnięto limit konsultantów dla planu ${planInfo.plan} (max ${planInfo.maxConsultants})`,
    }, { status: 403 });
  }

  // Następny sort_order
  const { data: maxRow } = await supabaseAdmin
    .from("business_consultants")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabaseAdmin
    .from("business_consultants")
    .insert({ business_id: businessId, name, phone: cleanedPhone, sort_order: nextOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/** Aktualizuje konsultanta (name, phone, sort_order) */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, phone, sort_order } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = normalizePhone(phone);
  if (sort_order !== undefined) update.sort_order = sort_order;

  const { data, error } = await supabaseAdmin
    .from("business_consultants")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** Usuwa konsultanta */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    const body = await request.json().catch(() => ({}));
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("business_consultants").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabaseAdmin.from("business_consultants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
