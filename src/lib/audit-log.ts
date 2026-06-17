import { supabaseAdmin } from "./supabase-admin";

interface AuditEntry {
  businessId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      business_id: entry.businessId || null,
      user_id: entry.userId || null,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId || null,
      details: entry.details || {},
      ip_address: entry.ipAddress || null,
    });
  } catch (err) {
    console.error("[audit-log] failed:", err);
  }
}
