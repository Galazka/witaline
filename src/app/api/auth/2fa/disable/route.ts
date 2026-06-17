import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Podaj kod z aplikacji" }, { status: 400 });
  }

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, two_factor_secret, two_factor_enabled")
    .eq("owner_uid", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Brak firmy" }, { status: 404 });
  if (!biz.two_factor_enabled) return NextResponse.json({ error: "2FA nie jest włączone" }, { status: 400 });
  if (!biz.two_factor_secret) return NextResponse.json({ error: "Brak sekretu" }, { status: 400 });

  const valid = verifyTOTP(biz.two_factor_secret, token);
  if (!valid) return NextResponse.json({ error: "Nieprawidłowy kod" }, { status: 400 });

  await supabaseAdmin
    .from("businesses")
    .update({ two_factor_enabled: false, two_factor_secret: null })
    .eq("id", biz.id);

  return NextResponse.json({ ok: true });
}
