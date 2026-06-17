import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getMemberRole } from "@/lib/rbac";
import { getAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const action = searchParams.get("action") || undefined;

  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const role = await getMemberRole(businessId, user.id);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await getAuditLog(businessId, { limit, offset, action });
  return NextResponse.json({ logs });
}
