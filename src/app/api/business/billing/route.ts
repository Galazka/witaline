import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

/** GET /api/business/billing?businessId=xxx — payment history for a business */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  // Verify access
  const { data: biz } = await supabase
    .from("businesses")
    .select("stripe_customer_id, owner_uid")
    .eq("id", businessId)
    .single();
  if (!biz || (biz.owner_uid !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!biz.stripe_customer_id) return NextResponse.json([]);

  try {
    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({
      customer: biz.stripe_customer_id,
      limit: 50,
      expand: ["data.invoice"],
    });

    const payments = sessions.data.map((s) => ({
      id: s.id,
      amount: s.amount_total || 0,
      currency: s.currency || "pln",
      status: s.payment_status || s.status,
      created: s.created,
      description: s.metadata?.type === "minute_package"
        ? `Pakiet ${s.metadata?.minutes} minut`
        : s.metadata?.type === "sms_package"
        ? `Pakiet ${s.metadata?.sms_count} SMS`
        : `Subskrypcja ${s.metadata?.plan || ""}`,
      metadata: s.metadata || {},
      invoice_url: (s.invoice as any)?.hosted_invoice_url || null,
      receipt_url: null,
    }));

    return NextResponse.json(payments);
  } catch (e) {
    console.error("[billing] error:", e);
    return NextResponse.json([]);
  }
}