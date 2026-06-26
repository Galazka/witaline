import { supabaseAdmin } from "@/lib/supabase-admin";
import { getElasticRate } from "@/lib/pricing";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/twilio-sms";
import { addNotification } from "@/lib/notifications";

export async function executeAutoTopup(businessId: string, business?: any): Promise<{ ok: boolean; reason?: string }> {
  if (!business) {
    const { data } = await supabaseAdmin
      .from("businesses")
      .select("id, name, phone, owner_uid, auto_topup_enabled, auto_topup_minutes_threshold, auto_topup_pack_size, prepaid_minutes, stripe_customer_id")
      .eq("id", businessId)
      .single();
    if (!data) return { ok: false, reason: "Business not found" };
    business = data;
  }

  if (!business.auto_topup_enabled) return { ok: false, reason: "Auto-topup not enabled" };
  if (!business.stripe_customer_id) return { ok: false, reason: "No Stripe customer" };

  const minutesLeft = parseFloat(String(business.prepaid_minutes || "0"));
  const threshold = business.auto_topup_minutes_threshold || 20;
  if (minutesLeft >= threshold) return { ok: false, reason: "Balance above threshold" };

  const packSize = business.auto_topup_pack_size || 100;
  const ratePLN = getElasticRate(packSize);
  const amountNettoPLN = Math.round(packSize * ratePLN * 100) / 100;
  const amountBruttoPLN = Math.round(amountNettoPLN * 1.23 * 100) / 100;
  const amountCents = Math.round(amountBruttoPLN * 100);

  let paymentIntent;
  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    const customer = await stripe.customers.retrieve(business.stripe_customer_id) as any;
    const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethod) {
      await supabaseAdmin.from("businesses").update({ auto_topup_enabled: false }).eq("id", business.id);
      await addNotification({
        businessId: business.id,
        type: "system",
        title: "Auto-topup wyłączony",
        message: "Brak karty płatniczej. Dodaj kartę w ustawieniach i włącz ponownie.",
      });
      const { data: owner } = await supabaseAdmin.auth.admin.getUserById(business.owner_uid);
      if (owner?.user?.email) {
        await sendEmail({
          to: owner.user.email,
          templateKey: "auto_topup_no_card",
          variables: { businessName: business.name || "WitaLine", dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard` },
        });
      }
      return { ok: false, reason: "No default payment method" };
    }

    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "pln",
      customer: business.stripe_customer_id,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      metadata: { businessId: business.id, type: "auto_topup", minutes: String(packSize) },
    });
  } catch (e: any) {
    await supabaseAdmin.from("businesses").update({ auto_topup_enabled: false }).eq("id", business.id);
    await addNotification({
      businessId: business.id,
      type: "system",
      title: "Auto-topup: błąd płatności",
      message: `Nie udało się doładować konta (${e?.message || "błąd"}). Sprawdź kartę i włącz ponownie.`,
    });
    const { data: owner } = await supabaseAdmin.auth.admin.getUserById(business.owner_uid);
    if (owner?.user?.email) {
      await sendEmail({
        to: owner.user.email,
        templateKey: "auto_topup_failed",
        variables: { businessName: business.name || "WitaLine", errorMessage: e?.message || "Nieznany błąd", dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard` },
      });
    }
    return { ok: false, reason: e?.message || "Payment error" };
  }

  if (paymentIntent?.status === "succeeded") {
    const newBalance = Math.round((minutesLeft + packSize) * 100) / 100;
    await supabaseAdmin.from("businesses").update({ prepaid_minutes: newBalance }).eq("id", business.id);

    await addNotification({
      businessId: business.id,
      type: "system",
      title: "Automatyczne doładowanie",
      message: `Doładowano ${packSize} min za ${amountBruttoPLN.toFixed(2).replace(".", ",")} PLN (saldo: ${newBalance.toFixed(0)} min)`,
      metadata: { amount_pln: amountBruttoPLN, minutes: packSize },
    });

    const { data: owner } = await supabaseAdmin.auth.admin.getUserById(business.owner_uid);
    if (owner?.user?.email) {
      await sendEmail({
        to: owner.user.email,
        templateKey: "auto_topup_success",
        variables: { packSize, amount: amountBruttoPLN.toFixed(2).replace(".", ","), balance: newBalance.toFixed(0), businessName: business.name || "WitaLine", dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://witaline.pl"}/dashboard` },
      });
    }

    if (business.phone) {
      await sendSms(business.phone, `WitaLine: Doładowano ${packSize} min (${amountBruttoPLN.toFixed(2).replace(".", ",")} PLN). Saldo: ${newBalance.toFixed(0)} min`, undefined, business.id);
    }

    return { ok: true };
  }

  return { ok: false, reason: "Payment not succeeded" };
}
