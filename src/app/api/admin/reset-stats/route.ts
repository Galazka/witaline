import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    await supabaseAdmin.from("call_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("conversations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("sms_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("wa_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("feedback").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("businesses").update({ minutes_used_this_week: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");

    return NextResponse.json({ ok: true, message: "Wszystkie dane testowe zostaly usuniete. Statystyki zresetowane." });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err instanceof Error ? err.message : "Reset failed" }, { status: 500 });
  }
}
