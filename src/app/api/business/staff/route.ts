import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isBusinessOwnerOrSuperAdmin } from "@/lib/permissions";
import type { StaffRole } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const businessId = url.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const isOwner = await isBusinessOwnerOrSuperAdmin(user.id, user.email || "", businessId);
  if (!isOwner) {
    const { data: staff } = await supabaseAdmin
      .from("business_staff")
      .select("role, is_active")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!staff || !["admin", "manager"].includes(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: staffList } = await supabaseAdmin
    .from("business_staff")
    .select("*, auth_users:user_id(email)")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("role", { ascending: true });

  // Get business owner info
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("owner_uid")
    .eq("id", businessId)
    .single();

  const { data: ownerProfile } = await supabaseAdmin.auth.admin.getUserById(biz?.owner_uid || "");

  const ownerInfo = biz ? {
    id: "owner",
    user_id: biz.owner_uid,
    role: "admin" as const,
    email: ownerProfile?.user?.email || "",
    is_owner: true,
  } : null;

  return NextResponse.json({
    owner: ownerInfo,
    staff: (staffList || []).map(s => ({
      ...s,
      email: (s as any).auth_users?.email || "",
      auth_users: undefined,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, email, role } = await request.json();
  if (!businessId || !email || !role) {
    return NextResponse.json({ error: "Missing businessId, email, or role" }, { status: 400 });
  }

  if (!["manager", "receptionist", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const isOwner = await isBusinessOwnerOrSuperAdmin(user.id, user.email || "", businessId);
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError || !users?.users) {
    return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 });
  }
  const invitedUser = users.users.find(u => u.email === email);
  if (!invitedUser) {
    return NextResponse.json({ error: "User not found. They must register first." }, { status: 404 });
  }

  const { data: existing } = await supabaseAdmin
    .from("business_staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", invitedUser.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "User already added to this business" }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("business_staff")
    .insert({
      business_id: businessId,
      user_id: invitedUser.user.id,
      role,
      invited_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, staff: data });
}
