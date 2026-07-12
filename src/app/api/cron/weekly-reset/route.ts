import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function checkCronAuth(request: Request): boolean {
  const header = request.headers.get("x-internal-secret");
  if (header === process.env.CRON_SECRET) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get("key") === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("businesses")
    .update({ minutes_used_this_week: 0 })
    .neq("minutes_used_this_week", 0)
    .select("id");

  if (error) {
    console.error("[cron/weekly-reset] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron/weekly-reset] reset ${data?.length || 0} businesses`);
  return NextResponse.json({ ok: true, reset: data?.length || 0 });
}

export const POST = GET;
