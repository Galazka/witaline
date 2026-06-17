import { NextResponse } from "next/server";

// Search available Twilio phone numbers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const areaCode = searchParams.get("areaCode") || "";
  const country = searchParams.get("country") || "PL";

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({
      Limit: "10",
      Country: country,
      VoiceEnabled: "true",
      SmsEnabled: "true",
    });
    if (areaCode) params.set("AreaCode", areaCode);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?${params}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Twilio API error" }, { status: 500 });
    }

    const numbers = (data.incoming_phone_numbers || []).map((n: Record<string, unknown>) => {
      const caps = (n.capabilities || {}) as Record<string, string | boolean>;
      return {
        phoneNumber: n.phone_number,
        friendlyName: n.friendly_name,
        monthlyPrice: n.monthly_cost,
        capabilities: {
          voice: caps.voice === "true" || caps.voice === true,
          sms: caps.sms === "true" || caps.sms === true,
        },
      };
    });

    return NextResponse.json({ numbers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
