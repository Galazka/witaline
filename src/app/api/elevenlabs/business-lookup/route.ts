import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const params = body.parameters as Record<string, string> | undefined;
    const rawQuery = params?.query ?? body.query as string | undefined;

    if (!rawQuery || typeof rawQuery !== "string" || !rawQuery.trim()) {
      return NextResponse.json({ ok: false, error: "missing query" }, { status: 400 });
    }

    const trimmed = rawQuery.trim();
    const isDtmf = /^\d{1,6}$/.test(trimmed);

    let { data } = await supabaseAdmin
      .from("businesses")
      .select("id, name, phone, system_prompt, extension, current_plan, calendar_settings, services, industry")
      .or(isDtmf ? `extension.eq.${trimmed}` : `name.ilike.%${trimmed}%`)
      .limit(1)
      .maybeSingle();

    if (!data && isDtmf) {
      const { data: byName } = await supabaseAdmin
        .from("businesses")
        .select("id, name, phone, system_prompt, extension, current_plan, calendar_settings, services, industry")
        .ilike("name", `%${trimmed}%`)
        .limit(1)
        .maybeSingle();
      data = byName;
    }

    const business = data;

    if (!business) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    }

    // Build a business info summary for the agent
    const calendarInfo = business.calendar_settings
      ? "Firma ma skonfigurowane godziny pracy w kalendarzu."
      : "Brak skonfigurowanych godzin pracy w kalendarzu.";

    const servicesInfo = business.services && Array.isArray(business.services) && business.services.length > 0
      ? `Dostępne usługi: ${(business.services as Array<{ name: string; duration_minutes: number; price?: number }>).map((s: { name: string; duration_minutes: number; price?: number }) => `${s.name} (${s.duration_minutes} min${s.price ? `, ${s.price} zł` : ""})`).join(", ")}`
      : "Brak zdefiniowanych usług.";

    return NextResponse.json({
      ok: true,
      business: {
        id: business.id,
        name: business.name,
        phone: business.phone,
        extension: business.extension,
        current_plan: business.current_plan,
        industry: business.industry,
        context: `${business.name} - ${business.industry || "usługi"}. ${calendarInfo} ${servicesInfo}`,
      },
    });
  } catch (err) {
    console.error("[business-lookup]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
