import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Service {
  name: string;
  price?: number;
  duration_minutes?: number;
  description?: string;
}

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
      .select("services")
      .eq("id", businessId)
      .single();

    if (error || !biz) {
      return NextResponse.json({ ok: false, error: "Nie znaleziono firmy." }, { status: 404 });
    }

    const services = biz.services as Service[] | null;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json({ ok: true, services: [], message: "Brak zdefiniowanych usług." });
    }

    return NextResponse.json({
      ok: true,
      services: services.map((s) => ({
        name: s.name,
        price: s.price || 0,
        duration: s.duration_minutes || 30,
        description: s.description || "",
      })),
      message: `Dostępne usługi: ${services.map((s) => `${s.name} (${s.duration_minutes || 30} min${s.price ? `, ${s.price} zł` : ""})`).join(", ")}.`,
    });
  } catch (err) {
    console.error("[get-services]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
