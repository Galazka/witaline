import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const params = body.parameters as Record<string, unknown> | undefined;
    const businessId = (params?.business_id || body.business_id || (body.custom_data as Record<string, unknown> | undefined)?.business_id) as string | undefined;

    if (!businessId) {
      return NextResponse.json({ ok: false, error: "Missing required field: business_id" }, { status: 400 });
    }

    const { data: biz, error } = await supabaseAdmin
      .from("businesses")
      .select("calendar_settings, name")
      .eq("id", businessId)
      .single();

    if (error || !biz) {
      return NextResponse.json({ ok: false, error: "Nie znaleziono firmy." }, { status: 404 });
    }

    const settings = biz.calendar_settings as Record<string, unknown> | null;
    if (!settings) {
      return NextResponse.json({ ok: true, hours: {}, message: "Brak skonfigurowanych godzin pracy." });
    }

    const dayNames = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];
    const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const hours: Record<string, string> = {};

    for (let i = 0; i < 7; i++) {
      const cfg = settings[dayKeys[i]] as { enabled?: boolean; start?: string; end?: string } | undefined;
      hours[dayNames[i]] = cfg?.enabled ? `${cfg.start || "09:00"} - ${cfg.end || "17:00"}` : "nieczynne";
    }

    return NextResponse.json({
      ok: true,
      business: biz.name,
      hours,
      message: `Godziny otwarcia ${biz.name}: ${Object.entries(hours).map(([d, h]) => `${d}: ${h}`).join(", ")}.`,
    });
  } catch (err) {
    console.error("[get-business-hours]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
