import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logId } = await req.json();
  if (!logId) return NextResponse.json({ error: "Missing logId" }, { status: 400 });

  const { data: log, error: logErr } = await supabaseAdmin
    .from("sms_logs")
    .select("id, business_id, to_number, message_body, status")
    .eq("id", logId)
    .single();

  if (logErr || !log) return NextResponse.json({ error: "Log not found" }, { status: 404 });

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_uid")
    .eq("id", log.business_id)
    .single();

  if (!business || business.owner_uid !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ error: "SMS not configured" }, { status: 500 });
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: log.to_number,
        From: from,
        Body: log.message_body,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message || "SMS failed" }, { status: 500 });
  }

  await supabaseAdmin
    .from("sms_logs")
    .update({ status: "sent", sent_at: new Date().toISOString(), twilio_sid: data.sid })
    .eq("id", logId);

  return NextResponse.json({ success: true });
}