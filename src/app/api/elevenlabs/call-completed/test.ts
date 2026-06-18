import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    console.log("ENV CHECK:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "PRESENT" : "MISSING");
    const { supabaseAdmin } = await import("@/lib/supabase-admin");
    return NextResponse.json({ ok: true, env: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT_SET" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
