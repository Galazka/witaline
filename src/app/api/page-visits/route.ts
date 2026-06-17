import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST: Track a page visit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, business_id } = body;

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    await supabaseAdmin.from("page_visits").insert({
      path,
      business_id: business_id || null,
      visitor_ip: request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "",
      user_agent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
