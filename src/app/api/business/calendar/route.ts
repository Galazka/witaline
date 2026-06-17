import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CalendarSettings } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("calendar_settings")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(biz.calendar_settings);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const businessId = body.business_id as string;
  delete body.business_id;

  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ calendar_settings: body })
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}





