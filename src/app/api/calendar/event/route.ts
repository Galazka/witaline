import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function refreshAccess(token: { access_token: string; refresh_token: string; expires_at: string; business_id: string }) {
  if (new Date(token.expires_at).getTime() > Date.now() + 60000) {
    return token.access_token;
  }
  if (!token.refresh_token || !CLIENT_ID || !CLIENT_SECRET) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: token.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  await supabaseAdmin
    .from("calendar_tokens")
    .update({
      access_token: data.access_token,
      expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    })
    .eq("business_id", token.business_id);

  return data.access_token;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, summary, startDateTime, endDateTime, description } = body;

  if (!businessId || !summary || !startDateTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: token } = await supabaseAdmin
    .from("calendar_tokens")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (!token) {
    return NextResponse.json({ error: "Calendar not connected" }, { status: 404 });
  }

  const accessToken = await refreshAccess(token);
  if (!accessToken) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  const event = {
    summary,
    description: description || "",
    start: { dateTime: startDateTime, timeZone: "Europe/Warsaw" },
    end: { dateTime: endDateTime || new Date(new Date(startDateTime).getTime() + 30 * 60000).toISOString(), timeZone: "Europe/Warsaw" },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message || "Failed to create event" }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}





