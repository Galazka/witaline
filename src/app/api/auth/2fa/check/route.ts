import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
  const { token, userId } = await request.json();
  if (!token || !userId) {
    return NextResponse.json({ error: "Missing token or userId" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, two_factor_secret, two_factor_enabled")
    .eq("owner_uid", userId)
    .single();

  if (!biz) return NextResponse.json({ error: "Brak firmy" }, { status: 404 });
  if (!biz.two_factor_enabled) return NextResponse.json({ ok: true, required: false });

  if (!biz.two_factor_secret) {
    return NextResponse.json({ ok: true, required: false });
  }

  const valid = verifyTOTP(biz.two_factor_secret, token);
  if (!valid) return NextResponse.json({ error: "Nieprawidłowy kod" }, { status: 401 });

  return NextResponse.json({ ok: true, required: true });
}
