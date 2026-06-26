import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isBusinessOwnerOrSuperAdmin } from "@/lib/permissions";
import crypto from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, email, role } = await request.json();
  if (!businessId || !email || !role) {
    return NextResponse.json({ error: "Missing businessId, email, or role" }, { status: 400 });
  }

  if (!["admin", "manager", "receptionist", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const isOwner = await isBusinessOwnerOrSuperAdmin(user.id, user.email || "", businessId);
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = (usersList?.users || []).find((u: any) => u.email === email);
  let targetUserId: string;

  if (existingUser) {
    targetUserId = existingUser.id;
  } else {
    const password = crypto.randomBytes(12).toString("hex");
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { invited_by: businessId },
    });
    if (createError || !newUser?.user) {
      return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 500 });
    }
    targetUserId = newUser.user.id;
  }

  const { data: existing } = await supabaseAdmin
    .from("business_staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (existing) {
    if (!existingUser) {
      // Re-activate if soft-deleted
      await supabaseAdmin.from("business_staff").update({ is_active: true, role, accepted_at: new Date().toISOString() }).eq("id", existing.id);
      return NextResponse.json({ ok: true, message: "User re-activated" });
    }
    return NextResponse.json({ error: "User already added to this business" }, { status: 409 });
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");

  const { data: staff, error } = await supabaseAdmin
    .from("business_staff")
    .insert({
      business_id: businessId,
      user_id: targetUserId,
      role,
      invite_email: email,
      invite_token: inviteToken,
      invited_by: user.id,
      accepted_at: existingUser ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";

  if (!existingUser) {
    const loginLink = `${appUrl}/login?email=${encodeURIComponent(email)}`;
    const { sendEmail } = await import("@/lib/email");
    sendEmail({
      to: email,
      templateKey: "generic",
      variables: {
        subject: `Zaproszenie do ${biz?.name || "WitaLine"}`,
        title: `Zostałeś zaproszony do ${biz?.name || "WitaLine"}`,
        body: `Masz teraz konto w WitaLine jako ${role} w firmie ${biz?.name || ""}. Zaloguj się: ${loginLink}`,
        cta_url: loginLink,
        cta_label: "Zaloguj się",
      },
    }).catch((e) => console.error("[staff/invite] email error:", e));
  } else {
    const dashboardLink = `${appUrl}/dashboard`;
    const { sendEmail } = await import("@/lib/email");
    sendEmail({
      to: email,
      templateKey: "generic",
      variables: {
        subject: `Dodano Cię do ${biz?.name || "WitaLine"}`,
        title: `Dodano Cię jako ${role}`,
        body: `Jesteś teraz członkiem zespołu ${biz?.name || ""} w WitaLine z rolą ${role}.`,
        cta_url: dashboardLink,
        cta_label: "Przejdź do panelu",
      },
    }).catch((e) => console.error("[staff/invite] email error:", e));
  }

  return NextResponse.json({ ok: true, staff, isNewUser: !existingUser });
}
