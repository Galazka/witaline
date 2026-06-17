import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, message } = await request.json();

  if (!to || !message) {
    return NextResponse.json({ error: "Missing to or message" }, { status: 400 });
  }

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    return NextResponse.json({ error: "SMS not configured" }, { status: 501 });
  }

  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM,
        Body: message,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message || "SMS failed" }, { status: 500 });
  }

  return NextResponse.json({ sid: data.sid, status: data.status });
}




