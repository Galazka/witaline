import { NextResponse } from "next/server";
import { sendUpcomingReminders } from "@/lib/calendar";

function checkCronAuth(request: Request): boolean {
  const header = request.headers.get("x-internal-secret");
  if (header === process.env.CRON_SECRET) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get("key") === process.env.CRON_SECRET;
}

async function handler(request: Request) {
  if (!checkCronAuth(request)) {
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

export const GET = handler;
export const POST = handler;
