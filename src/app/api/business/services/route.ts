import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Service } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("services")
    .eq("id", businessId)
    .single();

  if (!biz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json((biz.services || []) as Service[]);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessId, services } = body;

  if (!businessId || !Array.isArray(services)) {
    return NextResponse.json({ error: "Missing businessId or services array" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("businesses")
    .update({ services })
    .eq("id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}





