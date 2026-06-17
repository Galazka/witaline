import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getMemberRole, canEdit } from "@/lib/rbac";
import { logChanges, getRequestInfo } from "@/lib/audit";

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

async function getEditableBusiness(businessId: string, userId: string) {
  const role = await getMemberRole(businessId, userId);
  if (!canEdit(role)) return null;

  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, owner_uid, phone, name")
    .eq("id", businessId)
    .single();

  if (error || !business) return null;
  return business;
}

export async function GET(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await params;
  const business = await getEditableBusiness(businessId, user.id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ phone: business.phone || "" });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await params;
  const business = await getEditableBusiness(businessId, user.id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
  if (!phone) return NextResponse.json({ error: "Podaj numer telefonu do przekierowania" }, { status: 400 });

  const updates = { phone };
  const { ip, userAgent } = getRequestInfo(request);
  await logChanges(businessId, user.id, business, updates, "update", ip, userAgent);

  const { error } = await supabaseAdmin.from("businesses").update(updates).eq("id", businessId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, phone });
}
