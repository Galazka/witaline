import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

interface Anomaly {
  id: string;
  type: "name_change" | "role_change" | "verification_fraud" | "rapid_changes" | "new_member" | "nip_change";
  severity: "low" | "medium" | "high" | "critical";
  businessId: string;
  businessName: string;
  description: string;
  details: Record<string, unknown>;
  createdAt: string;
  flagged: boolean;
}

export async function GET(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const anomalies: Anomaly[] = [];

  // 1. Recent name changes (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: nameChanges } = await supabaseAdmin
    .from("audit_log")
    .select("id, business_id, user_id, old_value, new_value, created_at")
    .eq("action", "update_name")
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  if (nameChanges) {
    for (const nc of nameChanges) {
      const oldName = nc.old_value?.toLowerCase().trim() || "";
      const newName = nc.new_value?.toLowerCase().trim() || "";
      const distance = levenshtein(oldName, newName);
      const maxDist = Math.floor(Math.max(oldName.length, newName.length) * 0.3);

      const severity = distance > 5 ? "high" : distance > 3 ? "medium" : "low";
      const { data: biz } = await supabaseAdmin.from("businesses").select("name").eq("id", nc.business_id).single();

      anomalies.push({
        id: nc.id,
        type: "name_change",
        severity,
        businessId: nc.business_id,
        businessName: biz?.name || "Nieznana",
        description: `Zmiana nazwy: "${nc.old_value}" → "${nc.new_value}"`,
        details: { oldName: nc.old_value, newName: nc.new_value, distance },
        createdAt: nc.created_at,
        flagged: severity === "high",
      });
    }
  }

  // 2. Verification submissions (possible fraud)
  const { data: verifications } = await supabaseAdmin
    .from("audit_log")
    .select("id, business_id, user_id, action, new_value, created_at")
    .eq("action", "verification_submitted")
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  if (verifications) {
    for (const v of verifications) {
      const { data: biz } = await supabaseAdmin.from("businesses").select("name, created_at").eq("id", v.business_id).single();
      const bizAge = biz?.created_at ? (Date.now() - new Date(biz.created_at).getTime()) / 86400000 : 999;

      anomalies.push({
        id: v.id,
        type: "verification_fraud",
        severity: bizAge < 1 ? "high" : "low",
        businessId: v.business_id,
        businessName: biz?.name || "Nieznana",
        description: `Wniosek weryfikacyjny złożony ${bizAge < 1 ? "PRZED 24H OD REJESTRACJI" : `${Math.floor(bizAge)} dni po rejestracji`}`,
        details: { businessAgeDays: Math.floor(bizAge) },
        createdAt: v.created_at,
        flagged: bizAge < 1,
      });
    }
  }

  // 3. Role changes (new admin/viewer)
  const { data: roleChanges } = await supabaseAdmin
    .from("audit_log")
    .select("id, business_id, user_id, action, new_value, created_at")
    .in("action", ["invite_member", "update_member_role", "remove_member"])
    .gte("created_at", weekAgo)
    .order("created_at", { ascending: false });

  if (roleChanges) {
    for (const rc of roleChanges) {
      const { data: biz } = await supabaseAdmin.from("businesses").select("name").eq("id", rc.business_id).single();
      anomalies.push({
        id: rc.id,
        type: "role_change",
        severity: rc.action === "remove_member" ? "medium" : "low",
        businessId: rc.business_id,
        businessName: biz?.name || "Nieznana",
        description: rc.action === "invite_member"
          ? `Nowy członek: ${rc.new_value}`
          : rc.action === "remove_member"
          ? `Usunięto członka: ${rc.new_value}`
          : `Zmiana roli na: ${rc.new_value}`,
        details: { action: rc.action, value: rc.new_value },
        createdAt: rc.created_at,
        flagged: false,
      });
    }
  }

  // 4. Rapid changes (many updates in short time from same business)
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data: recentUpdates } = await supabaseAdmin
    .from("audit_log")
    .select("business_id, id")
    .gte("created_at", hourAgo);

  if (recentUpdates) {
    const counts: Record<string, number> = {};
    for (const ru of recentUpdates) {
      counts[ru.business_id] = (counts[ru.business_id] || 0) + 1;
    }
    for (const [bizId, count] of Object.entries(counts)) {
      if (count >= 10) {
        const { data: biz } = await supabaseAdmin.from("businesses").select("name").eq("id", bizId).single();
        anomalies.push({
          id: `rapid-${bizId}`,
          type: "rapid_changes",
          severity: count >= 20 ? "critical" : "high",
          businessId: bizId,
          businessName: biz?.name || "Nieznana",
          description: `${count} zmian w ciągu godziny`,
          details: { changeCount: count },
          createdAt: new Date().toISOString(),
          flagged: true,
        });
      }
    }
  }

  // 5. NIP changes (possible identity theft)
  const { data: nipChanges } = await supabaseAdmin
    .from("audit_log")
    .select("id, business_id, old_value, new_value, created_at")
    .eq("action", "update_nip")
    .gte("created_at", weekAgo);

  if (nipChanges) {
    for (const nc of nipChanges) {
      const { data: biz } = await supabaseAdmin.from("businesses").select("name").eq("id", nc.business_id).single();
      anomalies.push({
        id: nc.id,
        type: "nip_change",
        severity: "high",
        businessId: nc.business_id,
        businessName: biz?.name || "Nieznana",
        description: `Zmiana NIP: "${nc.old_value}" → "${nc.new_value}"`,
        details: { oldNip: nc.old_value, newNip: nc.new_value },
        createdAt: nc.created_at,
        flagged: true,
      });
    }
  }

  // Sort by severity then date
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => {
    const sv = severityOrder[a.severity] - severityOrder[b.severity];
    if (sv !== 0) return sv;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({
    anomalies: anomalies.slice(0, limit),
    flagged: anomalies.filter(a => a.flagged).length,
    total: anomalies.length,
  });
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
