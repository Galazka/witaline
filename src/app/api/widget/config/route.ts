import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .eq("owner_uid", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const embedCode = `<iframe
  src="${baseUrl}/widget?business=${business.id}"
  style="position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.12);z-index:9999;background:white"
  title="WitaLine Asystent"
></iframe>`;

  return NextResponse.json({
    businessId: business.id,
    embedCode,
    widgetUrl: `${baseUrl}/widget?business=${business.id}`,
  });
}




