import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAdminAuth } from "@/lib/admin-auth";

async function fetchTable(table: string, orderCol: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .order(orderCol, { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function GET(req: NextRequest) {
  const { error } = await checkAdminAuth();
  if (error) return error;

  const type = req.nextUrl.searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: "Missing type query param" }, { status: 400 });
  }

  try {
    if (type === "call_logs") {
      const data = await fetchTable("call_logs", "ended_at");
      return NextResponse.json({ data, count: data.length });
    }

    if (type === "conversations") {
      const data = await fetchTable("conversations", "created_at");
      return NextResponse.json({ data, count: data.length });
    }

    if (type === "sms_logs") {
      const data = await fetchTable("sms_logs", "created_at");
      return NextResponse.json({ data, count: data.length });
    }

    if (type === "all") {
      const [call_logs, conversations, sms_logs] = await Promise.all([
        fetchTable("call_logs", "ended_at"),
        fetchTable("conversations", "created_at"),
        fetchTable("sms_logs", "created_at"),
      ]);
      return NextResponse.json({
        call_logs: { data: call_logs, count: call_logs.length },
        conversations: { data: conversations, count: conversations.length },
        sms_logs: { data: sms_logs, count: sms_logs.length },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("[EXPORT] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
