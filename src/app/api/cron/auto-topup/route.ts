import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/twilio-sms";

export async function POST(request: Request) {
  const auth = request.headers.get("x-internal-secret");
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: businesses } = await supabaseAdmin
    .from("businesses")
    .select("id, name, phone, owner_uid, auto_topup_enabled, auto_topup_minutes_threshold, auto_topup_pack_size, prepaid_minutes")
    .eq("auto_topup_enabled", true)
    .not("stripe_customer_id", "is", null);

  if (!businesses?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const biz of businesses) {
    try {
      const minutesLeft = parseFloat(String(biz.prepaid_minutes || "0"));
      const threshold = biz.auto_topup_minutes_threshold || 20;

      if (minutesLeft >= threshold) continue;

      const packSize = biz.auto_topup_pack_size || 100;
      const ratePLN = 1.0;
      const amountNettoPLN = packSize * ratePLN;
      const amountBruttoPLN = Math.round(amountNettoPLN * 1.23 * 100) / 100;
      const amountCents = Math.round(amountBruttoPLN * 100);

      const stripe = getStripe();

      const customer = await stripe.customers.retrieve(biz.stripe_customer_id) as any;
      const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method;

      if (!defaultPaymentMethod) {
        const errorMsg = "Brak zapisanej karty do automatycznego doładowania.";
        await supabaseAdmin.from("businesses").update({ auto_topup_enabled: false }).eq("id", biz.id);
        await supabaseAdmin.from("notifications").insert({
          business_id: biz.id,
          type: "warning",
          title: "Auto-topup wyłączony",
          message: errorMsg + " Dodaj kartę w ustawieniach i włącz ponownie.",
        });

        // Send email about failure
        const { data: owner } = await supabaseAdmin.auth.admin.getUserById(biz.owner_uid);
        if (owner?.user?.email) {
          await sendEmail({
            to: owner.user.email,
            templateKey: "auto_topup_no_card",
            variables: {
              businessName: biz.name || "WitaLine",
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard`,
            },
          });
        }

        errors.push(`${biz.name}: ${errorMsg}`);
        continue;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "pln",
        customer: biz.stripe_customer_id,
        payment_method: defaultPaymentMethod,
        off_session: true,
        confirm: true,
        metadata: {
          businessId: biz.id,
          type: "auto_topup",
          minutes: String(packSize),
        },
      });

      if (paymentIntent.status === "succeeded") {
        const newBalance = Math.round((minutesLeft + packSize) * 100) / 100;
        await supabaseAdmin.from("businesses").update({ prepaid_minutes: newBalance }).eq("id", biz.id);

        // System notification
        await supabaseAdmin.from("notifications").insert({
          business_id: biz.id,
          type: "system",
          title: "Automatyczne doładowanie",
          message: `Doładowano ${packSize} min za ${amountBruttoPLN.toFixed(2).replace(".", ",")} PLN`,
          metadata: { amount_pln: amountBruttoPLN, minutes: packSize },
        }).catch(() => {});

        // Email notification
        const { data: owner } = await supabaseAdmin.auth.admin.getUserById(biz.owner_uid);
        if (owner?.user?.email) {
          await sendEmail({
            to: owner.user.email,
            templateKey: "auto_topup_success",
            variables: {
              packSize,
              amount: amountBruttoPLN.toFixed(2).replace(".", ","),
              balance: newBalance.toFixed(0),
              businessName: biz.name || "WitaLine",
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard`,
            },
          });
        }

        // SMS notification
        if (biz.phone) {
          await sendSms(
            biz.phone,
            `WitaLine: Doładowano ${packSize} min (${amountBruttoPLN.toFixed(2).replace(".", ",")} PLN). Saldo: ${newBalance.toFixed(0)} min`,
            undefined,
            biz.id
          );
        }
      }

      processed++;
    } catch (e: any) {
      // Payment failed — disable auto-topup, notify user
      try {
        await supabaseAdmin.from("businesses").update({ auto_topup_enabled: false }).eq("id", biz.id);
        await supabaseAdmin.from("notifications").insert({
          business_id: biz.id,
          type: "warning",
          title: "Auto-topup: błąd płatności",
          message: `Nie udało się automatycznie doładować konta. Sprawdź kartę i włącz ponownie.`,
        });

        const { data: owner } = await supabaseAdmin.auth.admin.getUserById(biz.owner_uid);
        if (owner?.user?.email) {
          await sendEmail({
            to: owner.user.email,
            templateKey: "auto_topup_failed",
            variables: {
              businessName: biz.name || "WitaLine",
              errorMessage: e?.message || "Nieznany błąd",
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard`,
            },
          });
        }

        if (biz.phone) {
          await sendSms(biz.phone, `WitaLine: Auto-topup nieudany (${e?.message || "błąd"}). Sprawdź kartę w panelu.`, undefined, biz.id);
        }
      } catch (notifyErr) {
        console.error("[auto-topup] notification error:", notifyErr);
      }

      errors.push(`${biz.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, processed, errors: errors.length > 0 ? errors : undefined });
}