import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("email_templates")
    .select("id, key, subject, description, updated_at")
    .order("key");
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { key, subject, html, description } = body;

  if (!key || !subject || !html) {
    return NextResponse.json({ error: "Brak wymaganych pól: key, subject, html" }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from("email_templates")
    .upsert({ key, subject, html, description: description || "", updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select()
    .single();

  return NextResponse.json(data);
}
