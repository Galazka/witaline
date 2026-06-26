import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("auto_topup_enabled, auto_topup_minutes_threshold, auto_topup_pack_size, owner_uid")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (business.owner_uid !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    enabled: business.auto_topup_enabled || false,
    threshold: business.auto_topup_minutes_threshold || 20,
    packSize: business.auto_topup_pack_size || 100,
  });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessId, enabled, threshold, packSize } = body;

  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("owner_uid, stripe_customer_id")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (business.owner_uid !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (enabled && !business.stripe_customer_id) {
    return NextResponse.json({ error: "Najpierw dodaj kartę w ustawieniach płatności." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (enabled !== undefined) updates.auto_topup_enabled = enabled;
  if (threshold !== undefined) updates.auto_topup_minutes_threshold = threshold;
  if (packSize !== undefined) updates.auto_topup_pack_size = packSize;

  const { error: dbError } = await supabaseAdmin
    .from("businesses")
    .update(updates)
    .eq("id", businessId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}