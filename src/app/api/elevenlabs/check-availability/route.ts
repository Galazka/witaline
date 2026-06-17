import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkAvailability } from "@/lib/calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const params = body.parameters as Record<string, unknown> | undefined;
    const businessId = (params?.business_id || body.business_id || (body.custom_data as Record<string, unknown> | undefined)?.business_id) as string | undefined;
    const date = (params?.date || body.date) as string | undefined;

    if (!businessId || !date) {
      return NextResponse.json({ ok: false, error: "Missing required fields: business_id, date" }, { status: 400 });
    }

    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("calendar_settings")
      .eq("id", businessId)
      .single();

    if (!biz?.calendar_settings) {
      return NextResponse.json({ ok: true, available: false, message: "Brak skonfigurowanego kalendarza dla tej firmy." });
    }

    const result = await checkAvailability(businessId, date);

    if (!result.available) {
      return NextResponse.json({
        ok: true,
        available: false,
        slots: [],
        nextDates: result.nextDates || [],
        message: result.nextDates?.length
          ? `Brak dostępnych terminów w tym dniu. Najbliższe dostępne dni: ${result.nextDates.join(", ")}.`
          : "Brak dostępnych terminów w tym dniu.",
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      slots: result.slots,
      message: `Dostępne terminy: ${result.slots.map(s => s.label).join(", ")}`,
    });
  } catch (err) {
    console.error("[check-availability]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
