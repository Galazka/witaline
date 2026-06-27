import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, nip, krs, verification_status, verified_at, owner_uid, owner_email:owner_uid(email)")
    .order("verification_status", { ascending: true })
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { businessId, status } = await request.json();
  if (!businessId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("businesses")
    .update({ 
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null 
    })
    .eq("id", businessId)
    .select("id, name, verification_status")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, business: data });
}