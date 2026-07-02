import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { getTwilioCredentials, getTwilioAuthFromCreds } from "@/lib/twilio-credentials";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (auth.error) return auth.error;

  const { phone } = await request.json();
  if (!phone) {
    return NextResponse.json({ error: "Missing 'phone' in body" }, { status: 400 });
  }

  let creds;
  try { creds = await getTwilioCredentials(auth.businessId); }
  catch { return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 }); }

  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) return NextResponse.json({ error: "Server URL not configured" }, { status: 500 });

  const statusCallback = `${baseUrl.replace(/\/+$/, "")}/api/twilio/spam-filter?businessId=${encodeURIComponent(auth.businessId)}`;

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) return NextResponse.json({ error: "Twilio phone number not configured" }, { status: 500 });

  const form = new URLSearchParams({
    To: phone.startsWith("+") ? phone : `+${phone}`,
    From: fromNumber,
    Url: statusCallback,
    StatusCallback: statusCallback,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${getTwilioAuthFromCreds(creds)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message || "Twilio error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, callSid: data.sid, status: data.status });
}
