import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, confirmText } = await request.json();
  if (confirmText !== "USUŃ KONTO") {
    return NextResponse.json({ error: "Potwierdź wpisując USUŃ KONTO" }, { status: 400 });
  }

  // Verify ownership
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, stripe_subscription_id")
    .eq("id", businessId)
    .eq("owner_uid", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Cancel Stripe subscription if exists
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (business.stripe_subscription_id && stripeKey) {
    try {
      await fetch(
        `https://api.stripe.com/v1/subscriptions/${business.stripe_subscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    } catch (e) {
      console.error("Stripe cancel error:", e);
    }
  }

  // Delete business — cascades to call_logs, reservations, feedback, transcriptions, etc.
  const { error: deleteErr } = await supabaseAdmin
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // Delete auth user
  const { error: userDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (userDeleteErr) {
    console.error("Auth user delete error:", userDeleteErr);
  }

  return NextResponse.json({ ok: true, message: "Konto zostało trwale usunięte." });
}
