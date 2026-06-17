import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createTOTP } from "@/lib/totp";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_uid")
    .eq("owner_uid", user.id)
    .single();

  if (!biz) return NextResponse.json({ error: "Brak firmy" }, { status: 404 });

  const email = user.email || user.id;
  const { secret, uri } = createTOTP(email);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;

  await supabaseAdmin
    .from("businesses")
    .update({ two_factor_secret: secret, two_factor_enabled: false })
    .eq("id", biz.id);

  return NextResponse.json({ secret, qrUrl, uri });
}
