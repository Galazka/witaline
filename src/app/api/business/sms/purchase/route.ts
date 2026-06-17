import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { business_id, pack_size } = body;

  if (!business_id || !pack_size || pack_size < 10) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the user owns this business
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("owner_uid, sms_extra_purchased")
    .eq("id", business_id)
    .single();

  if (!biz || biz.owner_uid !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Increment sms_extra_purchased
  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ sms_extra_purchased: (biz.sms_extra_purchased || 0) + pack_size })
    .eq("id", business_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    added: pack_size,
    total: (biz.sms_extra_purchased || 0) + pack_size,
  });
}
