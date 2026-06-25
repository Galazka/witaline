import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { submitVerification, verifyNIP, verifyDomain } from "@/lib/verification";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── GET: check verification status ──────────────────────────────────
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("verification_status, verified_at, nip, krs")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: biz.verification_status,
    verifiedAt: biz.verified_at,
    nip: biz.nip || null,
    krs: biz.krs || null,
  });
}

// ── POST: submit verification ───────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, nip, krs, domain } = await request.json();
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  // Validate NIP if provided
  if (nip) {
    const nipResult = await verifyNIP(nip);
    if (!nipResult.valid) {
      return NextResponse.json({ error: nipResult.error }, { status: 400 });
    }
  }

  // Verify domain if provided
  if (domain) {
    const domainResult = await verifyDomain(domain, businessId);
    if (!domainResult.verified) {
      return NextResponse.json({ error: domainResult.error }, { status: 400 });
    }
  }

  const result = await submitVerification(businessId, user.id, { nip, krs, domain });
  if (!result.ok) {
    const err = (result as { ok: false; error: string }).error;
    return NextResponse.json({ error: err }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: result.status });
}

// ── PATCH: admin approve/reject ─────────────────────────────────────
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can approve
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !adminEmail.split(",").includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, status } = await request.json();
  if (!businessId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { setVerificationStatus } = await import("@/lib/verification");
  const result = await setVerificationStatus(businessId, user.id, status);
  if (!result.ok) {
    const err = (result as { ok: false; error: string }).error;
    return NextResponse.json({ error: err }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
