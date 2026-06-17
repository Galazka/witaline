import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function PATCH(request: Request) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const body = await request.json();
  const { business_id, sms_limit, sms_extra_purchased } = body;

  if (!business_id) {
    return NextResponse.json({ error: "Missing business_id" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (sms_limit !== undefined) updateData.sms_limit = sms_limit;
  if (sms_extra_purchased !== undefined) updateData.sms_extra_purchased = sms_extra_purchased;

  const { error: dbError } = await supabaseAdmin
    .from("businesses")
    .update(updateData)
    .eq("id", business_id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { data } = await supabaseAdmin
    .from("businesses")
    .select("id, name, sms_limit, sms_used, sms_extra_purchased, suspended")
    .neq("name", "WitaLine")
    .order("name");

  if (!data) return NextResponse.json([]);

  const result = data.map(b => {
    const total = (b.sms_limit || 0) + (b.sms_extra_purchased || 0);
    const used = b.sms_used || 0;
    return {
      ...b,
      totalCapacity: total,
      remaining: Math.max(0, total - used),
      usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  });

  return NextResponse.json(result);
}
