import { NextResponse } from "next/server";
import { sendUpcomingReminders } from "@/lib/calendar";

// Cron endpoint for sending SMS reminders (call via CRON job or Vercel Cron)
// Example: GET https://witaline.pl/api/cron/send-reminders?key=YOUR_CRON_SECRET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendUpcomingReminders();
    return NextResponse.json({ ok: true, message: "Reminders sent" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
