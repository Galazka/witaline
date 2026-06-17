import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPaymentConfirmationEmail, sendPaymentFailedEmail } from "@/lib/email";

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
    if (endpointSecret && endpointSecret !== "dev" && endpointSecret.startsWith("whsec_")) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const obj = event.data?.object as any;

  if (event.type === "checkout.session.completed") {
    const businessId = obj?.client_reference_id || obj?.metadata?.businessId;
    const customerId = obj?.customer;
    const subscriptionId = obj?.subscription;
    const paymentType = obj?.metadata?.type;

    if (!businessId) return NextResponse.json({ received: true });

    // Handle minute package purchase (one-time payment)
    if (paymentType === "minute_package") {
      const minutes = parseFloat(obj?.metadata?.minutes || "0");
      if (minutes > 0) {
        const { data: biz } = await supabaseAdmin
          .from("businesses")
          .select("prepaid_minutes, lifetime_purchased_minutes")
          .eq("id", businessId)
          .single();

        const currentBalance = parseFloat(biz?.prepaid_minutes || "0");
        const currentLifetime = parseFloat(biz?.lifetime_purchased_minutes || "0");
        const newBalance = Math.round((currentBalance + minutes) * 100) / 100;
        const newLifetime = Math.round((currentLifetime + minutes) * 100) / 100;

        await supabaseAdmin
          .from("businesses")
          .update({
            stripe_customer_id: customerId || undefined,
            prepaid_minutes: newBalance,
            lifetime_purchased_minutes: newLifetime,
          })
          .eq("id", businessId);

        console.log("[stripe] minute package purchased:", { businessId, minutes, newBalance, newLifetime });
      }
      return NextResponse.json({ received: true });
    }

    // Subscription flow (existing)
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

      await supabaseAdmin
        .from("businesses")
        .update(updateData)
        .eq("id", businessId);

      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("name, current_plan")
        .eq("id", businessId)
        .single();
      if (biz) {
        sendPaymentConfirmationEmail(
          obj?.customer_details?.email || obj?.receipt_email || "",
          biz.name,
          biz.current_plan,
          obj?.amount_total || 0
        ).catch(err => console.error("[stripe] confirmation email error:", err));
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
