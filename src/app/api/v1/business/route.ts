import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (auth.error) return auth.error;

  const { data: biz, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, phone, email, address, category, timezone, business_hours, created_at, prepaid_minutes, sms_limit, sms_used, sms_extra_purchased")
    .eq("id", auth.businessId)
    .single();

  if (error || !biz) {
    return NextResponse.json({ error: error?.message || "Business not found" }, { status: 500 });
  }

  return NextResponse.json({ data: biz });
}
