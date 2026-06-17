import { supabaseAdmin } from "@/lib/supabase-admin";

export type MemberRole = "owner" | "admin" | "viewer";

export interface MemberInfo {
  user_id: string;
  role: MemberRole;
  business_id: string;
}

// ── Get user's role for a business ──────────────────────────────────
export async function getMemberRole(
  businessId: string,
  userId: string
): Promise<MemberRole | null> {
  const { data } = await supabaseAdmin
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.role as MemberRole) || null;
}

// ── Check if user has required permission level ─────────────────────
export function hasPermission(
  userRole: MemberRole | null,
  required: "owner" | "admin" | "viewer"
): boolean {
  if (!userRole) return false;
  const levels: Record<MemberRole, number> = { owner: 3, admin: 2, viewer: 1 };
  return (levels[userRole] || 0) >= (levels[required] || 0);
}

// ── Check if user can edit business settings ────────────────────────
export function canEdit(userRole: MemberRole | null): boolean {
  return hasPermission(userRole, "admin");
}

// ── Check if user can manage members ────────────────────────────────
export function canManageMembers(userRole: MemberRole | null): boolean {
  return hasPermission(userRole, "owner");
}

// ── Check if user can change billing/plan ───────────────────────────
export function canChangeBilling(userRole: MemberRole | null): boolean {
  return hasPermission(userRole, "owner");
}

// ── Add a member to a business ──────────────────────────────────────
export async function addMember(
  businessId: string,
  email: string,
  role: MemberRole,
  invitedBy: string
): Promise<{ ok: boolean; error?: string; inviteToken?: string }> {
  // Find user by email
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);

  // Check if already a member (by email or user_id)
  const { data: existing } = await supabaseAdmin
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .or(user ? `user_id.eq.${user.id},invite_email.eq.${email}` : `invite_email.eq.${email}`)
    .maybeSingle();

  if (existing) return { ok: false, error: "Użytkownik jest już członkiem tej firmy lub zaproszenie oczekuje" };

  if (user) {
    // User exists — add directly
    const { error } = await supabaseAdmin
      .from("business_members")
      .insert({
        business_id: businessId,
        user_id: user.id,
        role,
        invited_by: invitedBy,
        accepted_at: new Date().toISOString(),
      });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } else {
    // User doesn't exist — create pending invite with token
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    const { error } = await supabaseAdmin
      .from("business_members")
      .insert({
        business_id: businessId,
        user_id: "00000000-0000-0000-0000-000000000000", // placeholder
        role,
        invited_by: invitedBy,
        invite_token: token,
        invite_email: email,
      });

    if (error) return { ok: false, error: error.message };
    return { ok: true, inviteToken: token };
  }
}

// ── Remove a member ─────────────────────────────────────────────────
export async function removeMember(
  businessId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("business_members")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Update member role ──────────────────────────────────────────────
export async function updateMemberRole(
  businessId: string,
  userId: string,
  newRole: MemberRole
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("business_members")
    .update({ role: newRole })
    .eq("business_id", businessId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Get all members of a business ───────────────────────────────────
export async function getMembers(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("business_members")
    .select("id, user_id, role, invited_at, accepted_at, created_at")
    .eq("business_id", businessId)
    .order("created_at");

  return data || [];
}
