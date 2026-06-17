import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const adminEmail = process.env.ADMIN_EMAIL || "admin@witaline.pl";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const tables = ["call_logs", "conversations", "reservations", "feedback", "sms_logs"] as const;
    const deleted: Record<string, number> = {};

    for (const table of tables) {
      const { count } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.error(`[CLEAR] error deleting ${table}:`, error);
      deleted[table] = count ?? 0;
    }

    const { error: resetError } = await supabaseAdmin
      .from("businesses")
      .update({ minutes_used_this_week: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (resetError) {
      console.error("[CLEAR] error resetting minutes:", resetError);
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("[CLEAR] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
