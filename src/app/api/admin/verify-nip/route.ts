import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { verifyNipByGus } from "@/lib/gus";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let nip: string;
  try {
    const body = await request.json();
    nip = body.nip;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!nip || typeof nip !== "string" || !/^\d{10}$/.test(nip)) {
    return NextResponse.json({ success: false, error: "NIP must be exactly 10 digits" }, { status: 400 });
  }

  const hasGusKey = !!process.env.GUS_API_KEY;
  if (!hasGusKey) {
    return NextResponse.json({ success: false, error: "GUS API not configured", gusAvailable: false }, { status: 503 });
  }

  const data = await verifyNipByGus(nip);
  if (!data) {
    return NextResponse.json({ success: false, error: "Nie znaleziono w GUS" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
