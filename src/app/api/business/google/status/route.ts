import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: token } = await supabaseAdmin
    .from("calendar_tokens")
    .select("expires_at, created_at")
    .eq("business_id", businessId)
    .single();

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  const isExpired = new Date(token.expires_at).getTime() < Date.now();

  return NextResponse.json({
    connected: true,
    expired: isExpired,
    connectedAt: token.created_at,
  });
}
