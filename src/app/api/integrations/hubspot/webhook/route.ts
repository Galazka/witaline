import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-hubspot-signature") || "";

    const { data, error } = await supabaseAdmin.from("integration_logs").insert({
      provider: "hubspot",
      event_type: body.subscriptionType || "unknown",
      payload: body,
      headers: { signature },
    });

    if (error) console.error("[hubspot-webhook] db error:", error);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
