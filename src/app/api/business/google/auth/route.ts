import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google Calendar nie jest skonfigurowany. Brak GOOGLE_CLIENT_ID lub GOOGLE_CLIENT_SECRET." }, { status: 500 });
  }

  const origin = request.headers.get("origin") || `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("host") || "localhost:3000"}`;
  const redirectUri = `${origin}/api/business/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state: JSON.stringify({ businessId }),
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?${params}`;
  return NextResponse.json({ url: googleAuthUrl });
}
