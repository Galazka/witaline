import { supabaseAdmin } from "./supabase-admin";
import type { Permission, StaffRole } from "@/types/database";
import { ROLE_PERMISSIONS } from "@/types/database";

export interface PermissionCheck {
  hasAccess: boolean;
  role: StaffRole | null;
  isOwner: boolean;
  isSuperAdmin: boolean;
}

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];

/**
 * Check if a user has a specific permission for a business.
 * Business owners (admin role) and super admins bypass all checks.
 */
export async function checkPermission(
  userId: string,
  userEmail: string,
  businessId: string,
  permission: Permission,
): Promise<PermissionCheck> {
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail.toLowerCase());
  if (isSuperAdmin) {
    return { hasAccess: true, role: "admin", isOwner: false, isSuperAdmin: true };
  }

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("owner_uid, verification_status")
    .eq("id", businessId)
    .single();

  if (!biz) return { hasAccess: false, role: null, isOwner: false, isSuperAdmin: false };

  const isOwner = biz.owner_uid === userId;

  // Owner has full access if verified
  if (isOwner && biz.verification_status === "verified") {
    return { hasAccess: true, role: "admin", isOwner: true, isSuperAdmin: false };
  }

  // Check staff role
  const { data: staff } = await supabaseAdmin
    .from("business_staff")
    .select("role, permissions, is_active")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    // Owner without verification — allow basic access
    if (isOwner) {
      const basicPermissions: Permission[] = [
        "calls.read", "reservations.read", "reservations.create",
        "settings.read", "settings.update",
        "billing.read", "billing.buy",
      ];
      return { hasAccess: basicPermissions.includes(permission), role: null, isOwner: true, isSuperAdmin: false };
    }
    return { hasAccess: false, role: null, isOwner: false, isSuperAdmin: false };
  }

  const rolePermissions = getRolePermissions(staff.role);
  const explicitPermissions = staff.permissions || [];
  const allPermissions = [...new Set([...rolePermissions, ...explicitPermissions])];

  return { hasAccess: allPermissions.includes(permission), role: staff.role, isOwner: false, isSuperAdmin: false };
}

export function getRolePermissions(role: StaffRole): Permission[] {
  return (ROLE_PERMISSIONS[role] as Permission[]) || [];
}

/**
 * Check if a user is the business owner or super admin (bypass).
 */
export async function isBusinessOwnerOrSuperAdmin(
  userId: string,
  userEmail: string,
  businessId: string,
): Promise<boolean> {
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail.toLowerCase());
  if (isSuperAdmin) return true;

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("owner_uid")
    .eq("id", businessId)
    .single();

  return biz?.owner_uid === userId;
}

export { SUPER_ADMIN_EMAILS };
