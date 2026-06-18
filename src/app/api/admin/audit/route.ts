import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");
  const businessId = searchParams.get("businessId") || undefined;
  const action = searchParams.get("action") || undefined;
  const flagsOnly = searchParams.get("flags") === "true";

  let query = supabaseAdmin
    .from("audit_log")
    .select("id, business_id, user_id, action, field_name, old_value, new_value, ip_address, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (businessId) query = query.eq("business_id", businessId);
  if (action) query = query.eq("action", action);

  // Flag suspicious: name changes, role changes, verification changes
  if (flagsOnly) {
    query = query.in("action", [
      "update_name",
      "update_nip",
      "update_krs",
      "verification_submitted",
      "verification_verified",
      "verification_rejected",
      "invite_member",
      "remove_member",
      "update_member_role",
    ]);
  }

  const { data: logs, error: qErr } = await query;
  if (qErr) console.error("[admin-audit] query error:", qErr);

  // Get business names for the logs
  const bizIds = [...new Set((logs || []).map(l => l.business_id))];
  let bizNames: Record<string, string> = {};
  if (bizIds.length > 0) {
    const { data: businesses } = await supabaseAdmin
      .from("businesses")
      .select("id, name")
      .in("id", bizIds);
    if (businesses) {
      bizNames = Object.fromEntries(businesses.map(b => [b.id, b.name]));
    }
  }

  // Get user emails
  const userIds = [...new Set((logs || []).map(l => l.user_id))];
  let userEmails: Record<string, string> = {};
  for (const uid of userIds as string[]) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (userData?.user?.email) userEmails[uid] = userData.user.email;
  }

  const enriched = (logs || []).map(l => ({
    ...l,
    business_name: bizNames[l.business_id] || "Nieznana",
    user_email: userEmails[l.user_id] || l.user_id.slice(0, 8),
  }));

  return NextResponse.json({ logs: enriched, total: enriched.length });
}
