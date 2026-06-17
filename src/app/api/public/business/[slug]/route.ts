import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, services, calendar_settings")
    .eq("slug", slug)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Nie znaleziono firmy." }, { status: 404 });
  }

  const { id, name, services, calendar_settings } = business;

  return NextResponse.json({
    id,
    name,
    services,
    calendar_settings,
  });
}
