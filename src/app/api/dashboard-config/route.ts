import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET: Fetch dashboard config for a business
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const supabase = getSupabase();

  let { data } = await supabase
    .from("dashboard_configs")
    .select("*")
    .eq("business_id", businessId)
    .single();

  // Create default config if none exists
  if (!data) {
    const defaultConfig = {
      business_id: businessId,
      layout: {
        widgets: [
          { id: "stats", type: "stats", enabled: true, order: 0 },
          { id: "recent_chats", type: "chats", enabled: true, order: 1 },
          { id: "calls", type: "calls", enabled: true, order: 2 },
          { id: "reservations", type: "reservations", enabled: true, order: 3 },
          { id: "knowledge", type: "knowledge", enabled: false, order: 4 },
          { id: "transcriptions", type: "transcriptions", enabled: false, order: 5 },
        ],
      },
      theme: "light",
    };

    const { data: created } = await supabase
      .from("dashboard_configs")
      .insert(defaultConfig)
      .select()
      .single();

    data = created;
  }

  return NextResponse.json({ config: data });
}

// PATCH: Update dashboard config
export async function PATCH(request: Request) {
  const { businessId, layout, theme } = await request.json();

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const supabase = getSupabase();
  const updates: Record<string, unknown> = {};

  if (layout !== undefined) updates.layout = layout;
  if (theme !== undefined) updates.theme = theme;

  const { data, error } = await supabase
    .from("dashboard_configs")
    .update(updates)
    .eq("business_id", businessId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
