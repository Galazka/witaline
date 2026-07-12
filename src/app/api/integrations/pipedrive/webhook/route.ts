import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("integration_logs").insert({
      provider: "pipedrive",
      event_type: body.event || body.current?.event || "unknown",
      payload: body,
    });

    if (error) console.error("[pipedrive-webhook] db error:", error);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
