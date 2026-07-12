import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("owner_uid", user.id)
    .maybeSingle();

  if (!biz) return NextResponse.json({ business: null, callLogs: [], reservations: [] });

  const [logsRes, reservationsRes] = await Promise.all([
    supabaseAdmin
      .from("call_logs")
      .select("*")
      .eq("business_id", biz.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("business_id", biz.id)
      .order("reserved_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    business: biz,
    callLogs: logsRes.data || [],
    reservations: reservationsRes.data || [],
  });
}
