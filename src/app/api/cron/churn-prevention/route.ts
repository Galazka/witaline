import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/sendgrid";
import { WITALINE_CONTACT_EMAIL } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl";

export async function POST(request: Request) {
  const auth = request.headers.get("x-internal-secret");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find businesses with no calls in 7 days, have at least 1 total call, and have an owner email
  const { data: inactive } = await supabaseAdmin
    .from("businesses")
    .select("id, name, owner_uid, owner_email")
    .eq("suspended", false)
    .not("owner_email", "is", null)
    .gt("subscription_status", "");

  if (!inactive?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const biz of inactive) {
    try {
      const { count } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("created_at", sevenDaysAgo);

      if (count && count > 0) continue; // has recent calls, skip

      // Check if they ever had a call
      const { count: totalCalls } = await supabaseAdmin
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id);

      if (!totalCalls || totalCalls === 0) continue; // never had a call, skip

      await sendEmail({
        to: biz.owner_email!,
        subject: `Co się dzieje? Brak połączeń od 7 dni — ${biz.name}`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f8faf8;font-family:-apple-system,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#3CBF4A,#2EA03A);padding:32px;text-align:center;">
              <h1 style="color:white;font-size:24px;margin:0;">Brak aktywności</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="font-size:20px;color:#171717;margin:0 0 16px;">Cześć ${biz.name},</h2>
              <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">
                Zauważyliśmy, że od <strong>7 dni</strong> nie było żadnej rozmowy w Twoim asystencie AI.
                Czy wszystko działa prawidłowo?
              </p>
              <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;">
                <p style="font-size:13px;color:#92400e;margin:0;font-weight:600;">Możliwe przyczyny:</p>
                <ul style="font-size:13px;color:#92400e;margin:8px 0 0;padding-left:16px;">
                  <li>Numer telefonu nie jest przekierowany na WitaLine</li>
                  <li>Asystent wymaga aktualizacji promptu</li>
                  <li>Reklama nie generuje połączeń</li>
                  <li>Numer jest zablokowany u operatora</li>
                </ul>
              </div>
              <a href="${APP_URL}/dashboard" style="display:inline-block;background:#3CBF4A;color:white;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;">Przejdź do panelu →</a>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">Potrzebujesz pomocy? Odpowiedz na tego maila.</p>
            </div>
          </div></body></html>`,
        categories: ["churn-prevention"],
      });
      sent++;
    } catch (e) {
      errors.push(`${biz.name}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}
