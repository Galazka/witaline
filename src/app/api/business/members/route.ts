import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getMemberRole, hasPermission, addMember, removeMember, updateMemberRole, getMembers } from "@/lib/rbac";
import { logAudit, getRequestInfo } from "@/lib/audit";

// ── GET: list members ───────────────────────────────────────────────
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const role = await getMemberRole(businessId, user.id);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await getMembers(businessId);
  return NextResponse.json({ members, yourRole: role });
}

// ── POST: add member ────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, email, role } = await request.json();
  if (!businessId || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userRole = await getMemberRole(businessId, user.id);
  if (!hasPermission(userRole, "owner")) {
    return NextResponse.json({ error: "Tylko właściciel może zarządzać członkami" }, { status: 403 });
  }

  const result = await addMember(businessId, email, role, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const { ip, userAgent } = getRequestInfo(request);
  await logAudit({
    business_id: businessId,
    user_id: user.id,
    action: "invite_member",
    field_name: "members",
    new_value: `${email} (${role})`,
    ip_address: ip,
    user_agent: userAgent,
  });

  return NextResponse.json({ ok: true });
}

// ── PATCH: update member role ───────────────────────────────────────
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, userId, role } = await request.json();
  if (!businessId || !userId || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userRole = await getMemberRole(businessId, user.id);
  if (!hasPermission(userRole, "owner")) {
    return NextResponse.json({ error: "Tylko właściciel może zmieniać role" }, { status: 403 });
  }

  const result = await updateMemberRole(businessId, userId, role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const { ip, userAgent } = getRequestInfo(request);
  await logAudit({
    business_id: businessId,
    user_id: user.id,
    action: "update_member_role",
    field_name: "role",
    new_value: role,
    ip_address: ip,
    user_agent: userAgent,
  });

  return NextResponse.json({ ok: true });
}

// ── DELETE: remove member ───────────────────────────────────────────
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const userId = searchParams.get("userId");
  if (!businessId || !userId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const userRole = await getMemberRole(businessId, user.id);
  if (!hasPermission(userRole, "owner")) {
    return NextResponse.json({ error: "Tylko właściciel może usuwać członków" }, { status: 403 });
  }

  // Can't remove yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Nie możesz usunąć siebie" }, { status: 400 });
  }

  const result = await removeMember(businessId, userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const { ip, userAgent } = getRequestInfo(request);
  await logAudit({
    business_id: businessId,
    user_id: user.id,
    action: "remove_member",
    field_name: "members",
    old_value: userId,
    ip_address: ip,
    user_agent: userAgent,
  });

  return NextResponse.json({ ok: true });
}
