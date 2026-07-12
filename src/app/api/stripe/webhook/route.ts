import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPaymentConfirmationEmail, sendPaymentFailedEmail, sendInvoiceEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    if (!endpointSecret.startsWith("whsec_")) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting all webhooks");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const obj = event.data?.object as any;

  if (event.type === "checkout.session.completed") {
    const businessId = obj?.client_reference_id || obj?.metadata?.businessId;
    const customerId = obj?.customer;
    const subscriptionId = obj?.subscription;
    const paymentType = obj?.metadata?.type;
    const currency = obj?.metadata?.currency || "pln";
    const amountPLN = parseFloat(obj?.metadata?.amount_brutto_pln || obj?.metadata?.amount_pln || obj?.metadata?.price_pln || "0");

    if (!businessId) return NextResponse.json({ received: true });

    // Handle minute package purchase (one-time payment)
    if (paymentType === "minute_package") {
      const minutes = parseFloat(obj?.metadata?.minutes || "0");
      const appliedCouponId = obj?.metadata?.applied_coupon_id || null;

      if (minutes > 0) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("prepaid_minutes, lifetime_purchased_minutes, total_spent")
          .eq("id", businessId)
          .single();

        const currentBalance = parseFloat(biz?.prepaid_minutes || "0");
        const currentLifetime = parseFloat(biz?.lifetime_purchased_minutes || "0");
        const currentSpent = parseFloat(String(biz?.total_spent || "0"));
        const newBalance = Math.round((currentBalance + minutes) * 100) / 100;
        const newLifetime = Math.round((currentLifetime + minutes) * 100) / 100;
        const newSpent = currentSpent + amountPLN;

        await supabaseAdmin
          .from("businesses")
          .update({
            stripe_customer_id: customerId || undefined,
            prepaid_minutes: newBalance,
            lifetime_purchased_minutes: newLifetime,
            total_spent: newSpent,
          })
          .eq("id", businessId);

        // Mark coupon as used
        if (appliedCouponId) {
          await supabaseAdmin
            .from("referral_coupons")
            .update({ used: true, used_at: new Date().toISOString() })
            .eq("id", appliedCouponId);
        }

        // Notification about purchase with currency info
        const discountMsg = appliedCouponId ? ` (z kuponem rabatowym)` : "";
        try {
          await supabaseAdmin.from("notifications").insert({
            business_id: businessId,
            type: "system",
            title: currency === "pln" ? "Zakupiono pakiet minut" : "Minute package purchased",
            message: `${minutes} min — ${amountPLN.toFixed(2).replace(".", ",")} PLN${discountMsg}${currency !== "pln" ? ` (płatność ${currency.toUpperCase()})` : ""}`,
            metadata: { currency, amount_pln: amountPLN, minutes, applied_coupon_id: appliedCouponId },
          });
        } catch (e) {
          console.error("[stripe/webhook] notification insert error:", e);
        }

        console.log("[stripe] minute package purchased:", { businessId, minutes, currency, amountPLN, newBalance, appliedCouponId });
      }
      return NextResponse.json({ received: true });
    }

    // Handle SMS package purchase (one-time payment)
    if (paymentType === "sms_package") {
      const smsCount = parseInt(obj?.metadata?.sms_count || "0", 10);
      if (smsCount > 0) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("sms_extra_purchased, sms_used, total_spent")
          .eq("id", businessId)
          .single();

        const currentExtra = parseInt(String(biz?.sms_extra_purchased || "0"), 10);
        const currentSpent = parseFloat(String(biz?.total_spent || "0"));

        await supabaseAdmin
          .from("businesses")
          .update({
            stripe_customer_id: customerId || undefined,
            sms_extra_purchased: currentExtra + smsCount,
            total_spent: currentSpent + amountPLN,
          })
          .eq("id", businessId);

        try {
          await supabaseAdmin.from("notifications").insert({
            business_id: businessId,
            type: "system",
            title: currency === "pln" ? "Zakupiono pakiet SMS" : "SMS package purchased",
            message: `${smsCount} SMS — ${amountPLN.toFixed(2).replace(".", ",")} PLN${currency !== "pln" ? ` (płatność ${currency.toUpperCase()})` : ""}`,
            metadata: { currency, amount_pln: amountPLN, sms_count: smsCount },
          });
        } catch (e) {
          console.error("[stripe/webhook] notification insert error:", e);
        }

        console.log("[stripe] sms package purchased:", { businessId, smsCount, currency, amountPLN });
      }
      return NextResponse.json({ received: true });
    }

    // Subscription flow (existing + multi-currency)
    if (customerId) {
      const updateData: Record<string, unknown> = {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId || "",
        subscription_status: "active",
        suspended: false,
      };

      if (subscriptionId) {
        try {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId as string);
          if (subscription?.current_period_end) {
            updateData.subscription_current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
        } catch (e) {
          console.error("[stripe] failed to fetch subscription period end:", e);
        }
      }

      // Update total_spent with PLN-equivalent amount
      if (amountPLN > 0) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("total_spent")
          .eq("id", businessId)
          .single();
        const currentSpent = parseFloat(String(biz?.total_spent || "0"));
        updateData.total_spent = currentSpent + amountPLN;
      }

      await supabaseAdmin
        .from("businesses")
        .update(updateData)
        .eq("id", businessId);

      // Notification with currency info
      try {
        await supabaseAdmin.from("notifications").insert({
          business_id: businessId,
          type: "system",
          title: currency === "pln" ? "Subskrypcja aktywowana" : "Subscription activated",
          message: `${obj?.metadata?.plan || "subscription"}${currency !== "pln" ? ` (${currency.toUpperCase()})` : ""} — ${amountPLN.toFixed(2).replace(".", ",")} PLN`,
          metadata: { currency, amount_pln: amountPLN, plan: obj?.metadata?.plan },
        });
      } catch (e) {
        console.error("[stripe/webhook] notification insert error:", e);
      }

      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("name, current_plan")
        .eq("id", businessId)
        .single();
      if (biz) {
        const customerEmail = obj?.customer_details?.email || obj?.receipt_email || "";
        sendPaymentConfirmationEmail(customerEmail, biz.name, biz.current_plan, obj?.amount_total || 0)
          .catch(err => console.error("[stripe] confirmation email error:", err));

        // Send invoice with PDF if available
        if (customerEmail && obj?.amount_total > 0) {
          let invoiceUrl: string | undefined;
          if (obj.invoice) {
            try {
              const invoice: any = await stripe.invoices.retrieve(obj.invoice as string);
              invoiceUrl = invoice?.invoice_pdf || undefined;
            } catch {}
          }
          sendInvoiceEmail(customerEmail, biz.name, obj?.amount_total || 0, invoiceUrl)
            .catch(err => console.error("[stripe] invoice email error:", err));
        }
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = obj;
    if (!sub?.id) return NextResponse.json({ received: true });

    const { data: businesses } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("stripe_subscription_id", sub.id);

    if (businesses && businesses.length > 0) {
      const statusMap: Record<string, string> = {
        active: "active",
        trialing: "active",
        past_due: "past_due",
        canceled: "canceled",
        incomplete: "incomplete",
      };
      const dbStatus = statusMap[sub.status] || "incomplete";

      const updateData: Record<string, unknown> = {
        subscription_status: dbStatus,
        suspended: dbStatus !== "active",
      };

      // Zapisz current_period_end z Stripe (Unix timestamp → ISO)
      if (sub.current_period_end) {
        updateData.subscription_current_period_end = new Date(sub.current_period_end * 1000).toISOString();
      }

      await supabaseAdmin
        .from("businesses")
        .update(updateData)
        .eq("id", businesses[0].id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = obj;
    if (!sub?.id) return NextResponse.json({ received: true });

    await supabaseAdmin
      .from("businesses")
      .update({ subscription_status: "canceled", suspended: true })
      .eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = obj;
    if (invoice?.subscription) {
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("id, name")
        .eq("stripe_subscription_id", invoice.subscription)
        .single();

      await supabaseAdmin
        .from("businesses")
        .update({ subscription_status: "past_due" })
        .eq("stripe_subscription_id", invoice.subscription);

      // Send payment failed email
      if (biz && invoice?.customer_email) {
        sendPaymentFailedEmail(invoice.customer_email, biz.name).catch(err =>
          console.error("[stripe] payment failed email error:", err)
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
