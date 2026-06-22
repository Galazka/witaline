import { supabaseAdmin } from "@/lib/supabase-admin";

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

export async function getTwilioCredentials(businessId?: string): Promise<TwilioCredentials> {
  if (businessId) {
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("twilio_account_sid, twilio_auth_token")
      .eq("id", businessId)
      .single();

    if (biz?.twilio_account_sid && biz?.twilio_auth_token) {
      return { accountSid: biz.twilio_account_sid, authToken: biz.twilio_auth_token };
    }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return { accountSid: sid, authToken: token };
}

export function getTwilioAuthFromCreds(creds: TwilioCredentials): string {
  return Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64");
}

export async function createTwilioSubaccount(friendlyName: string): Promise<TwilioCredentials> {
  const masterSid = process.env.TWILIO_ACCOUNT_SID;
  const masterToken = process.env.TWILIO_AUTH_TOKEN;
  if (!masterSid || !masterToken) throw new Error("Master Twilio credentials not configured");

  const auth = Buffer.from(`${masterSid}:${masterToken}`).toString("base64");
  const form = new URLSearchParams({ FriendlyName: friendlyName });

  const res = await fetch("https://api.twilio.com/2010-04-01/Accounts.json", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio subaccount creation failed: ${data.message || data.error_message || res.statusText}`);

  return { accountSid: data.sid, authToken: data.auth_token };
}
