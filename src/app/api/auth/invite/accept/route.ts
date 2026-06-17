import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Brak tokenu" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Zaloguj się, aby zaakceptować zaproszenie" }, { status: 401 });

  // Find the pending invite
  const { data: invite } = await supabaseAdmin
    .from("business_members")
    .select("id, business_id, role, invite_email, invite_token, user_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "Nieprawidłowe lub wygasłe zaproszenie" }, { status: 404 });

  if (invite.user_id !== "00000000-0000-0000-0000-000000000000") {
    return NextResponse.json({ error: "Zaproszenie zostało już zaakceptowane" }, { status: 400 });
  }

  // Check if email matches
  if (invite.invite_email && invite.invite_email !== user.email) {
    return NextResponse.json({ error: "Zaproszenie jest adresowane do innego użytkownika" }, { status: 403 });
  }

  // Update the invite with the real user_id
  const { error } = await supabaseAdmin
    .from("business_members")
    .update({
      user_id: user.id,
      invite_token: null,
      invite_email: null,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, businessId: invite.business_id });
}
