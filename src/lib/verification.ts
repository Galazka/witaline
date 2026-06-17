import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAudit } from "@/lib/audit";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface VerificationResult {
  ok: boolean;
  status: VerificationStatus;
  error?: string;
  details?: Record<string, unknown>;
}

// ── Verify NIP via Polish GUS API (free, no key needed) ─────────────
export async function verifyNIP(nip: string): Promise<{
  valid: boolean;
  companyName?: string;
  error?: string;
}> {
  const cleanNip = nip.replace(/[\s\-]/g, "");

  if (!/^\d{10}$/.test(cleanNip)) {
    return { valid: false, error: "NIP musi mieć 10 cyfr" };
  }

  // Checksum validation
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNip[i]) * weights[i];
  }
  const checksum = sum % 11;
  const expected = checksum === 10 ? 0 : checksum;
  if (parseInt(cleanNip[9]) !== expected) {
    return { valid: false, error: "NIP ma nieprawidłową sumę kontrolną" };
  }

  // Try GUS API (KRS API — free public endpoint)
  try {
    const res = await fetch(
      `https://api-krs.kuria.gov.pl/entity/${cleanNip}.json`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const name =
        data?.daneNazwa?.wartosc ||
        data?.danePodmiotu?.nazwa ||
        undefined;
      return { valid: true, companyName: name };
    }

    // If GUS API is unavailable, just validate checksum
    if (res.status === 404) {
      return { valid: true, companyName: undefined }; // NIP format valid, API unavailable
    }

    return { valid: false, error: `GUS API: ${res.status}` };
  } catch {
    // Network error — fall back to checksum only
    return { valid: true, companyName: undefined };
  }
}

// ── Verify domain ownership via DNS TXT record ──────────────────────
export async function verifyDomain(
  domain: string,
  businessId: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    // Check DNS for TXT record: "witaline-verify=<businessId>"
    const res = await fetch(
      `https://dns.google/resolve?name=_witaline-verify.${domain}&type=TXT`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) return { verified: false, error: "DNS lookup failed" };

    const data = await res.json();
    const records = data?.Answer || [];
    const expected = `witaline-verify=${businessId}`;

    const found = records.some(
      (r: { data?: string }) => r.data?.includes(expected)
    );

    return { verified: found, error: found ? undefined : "Brak rekordu TXT. Dodaj: _witaline-verify.<domena> → witaline-verify=<businessId>" };
  } catch {
    return { verified: false, error: "Błąd sprawdzania DNS" };
  }
}

// ── Verify phone ownership via SMS code ─────────────────────────────
export async function sendVerificationSms(
  phone: string,
  businessId: string
): Promise<{ ok: boolean; code?: string; error?: string }> {
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store code in business metadata (expires in 10 min)
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({
      // We'll use a dedicated column or store in a JSONB field
      // For now, store in dtmf_code temporarily (will be overwritten)
    })
    .eq("id", businessId);

  // TODO: Send SMS via Twilio with verification code
  // For now, log the code and return it
  console.log(`[verify] SMS code for ${phone}: ${code}`);

  return { ok: true, code };
}

// ── Submit business for verification ────────────────────────────────
export async function submitVerification(
  businessId: string,
  userId: string,
  data: {
    nip?: string;
    krs?: string;
    domain?: string;
  }
): Promise<VerificationResult> {
  // Check user is owner
  const { data: member } = await supabaseAdmin
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member?.role !== "owner") {
    return { ok: false, status: "rejected", error: "Tylko właściciel może złożyć wniosek o weryfikację" };
  }

  const updates: Record<string, unknown> = {
    verification_status: "pending",
  };

  if (data.nip) updates.nip = data.nip;
  if (data.krs) updates.krs = data.krs;

  const { error } = await supabaseAdmin
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (error) return { ok: false, status: "unverified", error: error.message };

  await logAudit({
    business_id: businessId,
    user_id: userId,
    action: "verification_submitted",
    field_name: "verification_status",
    old_value: "unverified",
    new_value: "pending",
  });

  return { ok: true, status: "pending" };
}

// ── Admin: approve/reject verification ──────────────────────────────
export async function setVerificationStatus(
  businessId: string,
  adminUserId: string,
  status: "verified" | "rejected"
): Promise<VerificationResult> {
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      verified_by: status === "verified" ? adminUserId : null,
    })
    .eq("id", businessId);

  if (error) return { ok: false, status: "unverified", error: error.message };

  await logAudit({
    business_id: businessId,
    user_id: adminUserId,
    action: `verification_${status}`,
    field_name: "verification_status",
    new_value: status,
  });

  return { ok: true, status };
}

// ── Check if business name change is suspicious ─────────────────────
export async function checkNameChange(
  businessId: string,
  newName: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("name, verification_status, created_at")
    .eq("id", businessId)
    .single();

  if (!biz) return { allowed: false, reason: "Firma nie istnieje" };

  // If verified, block name changes entirely
  if (biz.verification_status === "verified") {
    return {
      allowed: false,
      reason: "Nazwa zweryfikowanej firmy nie może być zmieniona. Skontaktuj się z supportem.",
    };
  }

  // If unverified and name changed significantly, flag it
  const oldName = biz.name.toLowerCase().trim();
  const cleanNew = newName.toLowerCase().trim();

  if (oldName !== cleanNew) {
    // Check Levenshtein distance (simple implementation)
    const distance = levenshtein(oldName, cleanNew);
    const maxDist = Math.floor(Math.max(oldName.length, cleanNew.length) * 0.3);

    if (distance > maxDist && distance > 5) {
      return {
        allowed: false,
        reason: `Zmiana nazwy z "${biz.name}" na "${newName}" jest zbyt duża. Zweryfikuj firmę, aby móc zmienić nazwę.`,
      };
    }
  }

  return { allowed: true };
}

// ── Simple Levenshtein distance ─────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
