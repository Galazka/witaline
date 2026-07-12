import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error, user } = await checkAdminAuth();
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, nip, krs, verification_status, verification_doc_url, verification_notes, verified_at, owner_uid, owner_email:owner_uid(email)")
    .order("verification_status", { ascending: true })
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Fetch verification logs for each business
  const enriched = await Promise.all(
    (data || []).map(async (biz) => {
      const { data: logs } = await supabaseAdmin
        .from("verification_logs")
        .select("id, old_status, new_status, note, created_at, changed_by, admin_email:changed_by(email)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return { ...biz, logs: logs || [] };
    })
  );

  return NextResponse.json(enriched);
}

export async function PATCH(request: Request) {
  const { error: authErr, user } = await checkAdminAuth();
  if (authErr) return authErr;

  const { businessId, status, note } = await request.json();
  if (!businessId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get current business state
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("verification_status")
    .eq("id", businessId)
    .single();

  const oldStatus = biz?.verification_status || "unverified";

  const { data, error: dbError } = await supabaseAdmin
    .from("businesses")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      verified_by: status === "verified" ? user.id : null,
      verification_notes: note || null,
    })
    .eq("id", businessId)
    .select("id, name, verification_status")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Log the change
  await supabaseAdmin
    .from("verification_logs")
    .insert({
      business_id: businessId,
      changed_by: user.id,
      old_status: oldStatus,
      new_status: status,
      note: note || null,
    });

  return NextResponse.json({ success: true, business: data });
}
