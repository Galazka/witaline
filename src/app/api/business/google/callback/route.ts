import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateRaw = searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  let state: { businessId: string; userId: string };
  try {
    state = JSON.parse(stateRaw || "{}");
  } catch {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  const { businessId, userId } = state;
  if (!businessId || !userId) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  const redirectUri = `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host") || "localhost:3000"}/api/business/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", request.url));
  }

  await supabaseAdmin.from("calendar_tokens").upsert({
    business_id: businessId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || "",
    expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
    created_at: new Date().toISOString(),
  }, { onConflict: "business_id" });

  return NextResponse.redirect(new URL("/dashboard?calendar=connected", request.url));
}
