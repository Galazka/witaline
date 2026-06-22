import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { createTwilioSubaccount } from "@/lib/twilio-credentials";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { id } = await params;

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("name, twilio_account_sid")
    .eq("id", id)
    .single();

  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (biz.twilio_account_sid) {
    return NextResponse.json({ error: "Business already has a Twilio subaccount" }, { status: 400 });
  }

  try {
    const creds = await createTwilioSubaccount(`WitaLine - ${biz.name}`);

    const { error: updateErr } = await supabaseAdmin
      .from("businesses")
      .update({ twilio_account_sid: creds.accountSid, twilio_auth_token: creds.authToken })
      .eq("id", id);

    if (updateErr) throw new Error(updateErr.message);

    return NextResponse.json({
      success: true,
      account_sid: creds.accountSid,
      message: "Subkonto Twilio utworzone",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
