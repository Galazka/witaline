import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

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
      id: b.id,
      name: b.name,
      smsLimit: b.sms_limit || 0,
      smsExtra: b.sms_extra_purchased || 0,
      smsUsed: used,
      totalCapacity: total,
      remaining: Math.max(0, total - used),
      usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
      suspended: b.suspended,
    };
  });

  return NextResponse.json(result);
}
