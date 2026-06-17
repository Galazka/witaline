import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 200, statusText: "OK" });
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // Account balance
    const balRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    // This month's usage
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const usageRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Usage/Records/ThisMonth.json`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const accountData = balRes.ok ? await balRes.json() : null;
    const usageData = usageRes.ok ? await usageRes.json() : null;

    return NextResponse.json({
      balance: accountData
        ? {
            sid: accountData.sid,
            friendly_name: accountData.friendly_name,
            status: accountData.status,
            type: accountData.type,
          }
        : null,
      usage: usageData
        ? {
            total_price: usageData.usage_records?.find(
              (r: Record<string, unknown>) => r.category === "totalprice"
            )?.price,
            calls: usageData.usage_records?.find(
              (r: Record<string, unknown>) => r.category === "calls"
            ),
            sms: usageData.usage_records?.find(
              (r: Record<string, unknown>) => r.category === "sms"
            ),
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Twilio data" });
  }
}
