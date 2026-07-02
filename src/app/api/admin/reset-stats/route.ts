import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const results: string[] = [];

  try {
    const tables = [
      "call_logs",
      "conversations",
      "sms_logs",
      "wa_logs",
      "notifications",
      "leads",
      "reservations",
      "feedback",
      "cost_items",
      "audit_logs",
      "transfer_attempts",
      "contact_messages",
    ];
    for (const table of tables) {
      const { error: delErr } = await supabaseAdmin
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) {
        results.push(`${table}: ${delErr.message}`);
      } else {
        results.push(`${table}: wyczyszczono`);
      }
    }

    const { error: bizErr1 } = await supabaseAdmin
      .from("businesses")
      .update({
        minutes_used_this_week: 0,
        prepaid_minutes: 0,
        sms_extra_purchased: 0,
        trial_minutes_used: 0,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: "inactive",
        subscription_current_period_end: null,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (bizErr1) {
      results.push(`businesses update: ${bizErr1.message}`);
    } else {
      results.push(`businesses: statystyki zresetowane`);
    }

    return NextResponse.json({
      ok: true,
      message: "Wszystkie dane testowe usunięte. Statystyki zresetowane.",
      results,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err instanceof Error ? err.message : "Reset failed",
    }, { status: 500 });
  }
}
