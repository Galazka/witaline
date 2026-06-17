import { supabaseAdmin } from "@/lib/supabase-admin";

export interface AuditEntry {
  business_id: string;
  user_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
}

// ── Log an audit event ──────────────────────────────────────────────
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    // Truncate values to 2000 chars to prevent abuse
    const truncate = (s: string | undefined) =>
      s && s.length > 2000 ? s.slice(0, 2000) + "..." : s || null;

    const { error } = await supabaseAdmin.from("audit_log").insert({
      business_id: entry.business_id,
      user_id: entry.user_id,
      action: entry.action,
      field_name: entry.field_name || null,
      old_value: truncate(entry.old_value),
      new_value: truncate(entry.new_value),
      ip_address: entry.ip_address || null,
      user_agent: truncate(entry.user_agent),
    });

    if (error) console.error("[audit] log error:", error);
  } catch (err) {
    console.error("[audit] log exception:", err);
  }
}

// ── Get audit log for a business ────────────────────────────────────
export async function getAuditLog(
  businessId: string,
  options: { limit?: number; offset?: number; action?: string } = {}
) {
  const { limit = 50, offset = 0, action } = options;

  let query = supabaseAdmin
    .from("audit_log")
    .select("id, user_id, action, field_name, old_value, new_value, ip_address, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq("action", action);

  const { data, error } = await query;
  if (error) console.error("[audit] query error:", error);
  return data || [];
}

// ── Helper: compare objects and log changes ─────────────────────────
export async function logChanges(
  businessId: string,
  userId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  actionPrefix: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  const TRACKED_FIELDS = [
    "name", "industry", "website_url", "phone", "system_prompt",
    "voice_id", "twilio_number", "current_plan", "nip", "krs",
    "menu_catalog", "dtmf_code",
  ];

  for (const field of TRACKED_FIELDS) {
    const oldVal = String(oldData[field] ?? "");
    const newVal = String(newData[field] ?? "");

    if (oldVal !== newVal) {
      await logAudit({
        business_id: businessId,
        user_id: userId,
        action: `${actionPrefix}_${field}`,
        field_name: field,
        old_value: oldVal,
        new_value: newVal,
        ip_address: ip,
        user_agent: userAgent,
      });
    }
  }
}

// ── Extract client info from request ────────────────────────────────
export function getRequestInfo(request: Request) {
  return {
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}
