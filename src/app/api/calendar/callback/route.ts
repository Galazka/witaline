import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  : "http://localhost:3000/api/calendar/callback";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  let state: { businessId: string; userId: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
  } catch {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  // Get calendar email
  const emailRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const calendarData = await emailRes.json();
  const calendarEmail =
    calendarData?.items?.[0]?.id || "unknown";

  // Store tokens
  await supabaseAdmin.from("calendar_tokens").upsert(
    {
      business_id: state.businessId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || "",
      expires_at: new Date(
        Date.now() + (tokens.expires_in || 3600) * 1000
      ).toISOString(),
      calendar_email: calendarEmail,
    },
    { onConflict: "business_id" }
  );

  return NextResponse.redirect(new URL("/dashboard?calendar=connected", request.url));
}





