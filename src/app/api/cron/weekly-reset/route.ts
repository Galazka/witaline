import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const auth = process.env.CRON_SECRET;
  if (auth && auth !== "dev") {
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
