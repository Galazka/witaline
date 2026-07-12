import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.from("integration_logs").insert({
      provider: "livespace",
      event_type: body.event_type || body.action || "unknown",
      payload: body,
    });

    if (error) console.error("[livespace-webhook] db error:", error);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
