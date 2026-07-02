import { NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio-sms";
import { authenticateApiKey } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (auth.error) return auth.error;

  const { to, message } = await request.json();
  if (!to || !message) {
    return NextResponse.json({ error: "Missing 'to' or 'message' in body" }, { status: 400 });
  }

  const result = await sendSms(to, message, undefined, auth.businessId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, twilioSid: result.twilioSid });
}
