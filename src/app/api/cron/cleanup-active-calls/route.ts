import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const auth = request.headers.get("x-internal-secret") || request.headers.get("x-cron-secret");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("active_calls")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("count");

  return NextResponse.json({
    ok: true,
    deleted: data?.length || 0,
    error: error?.message || null,
  });
}
