import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { createBooking } from "@/lib/calendar";
import { sendSlackNotification, reservationSlackBlocks } from "@/lib/slack-notify";
import { logAudit } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const params = body.parameters as Record<string, unknown> | undefined;
    const businessId = (params?.business_id || body.business_id || (body.custom_data as Record<string, unknown> | undefined)?.business_id) as string | undefined;
    const reservedAt = (params?.reserved_at || body.reserved_at) as string | undefined;
    const serviceType = (params?.service_type || body.service_type) as string | undefined;
    const callerName = (params?.caller_name || body.caller_name) as string | undefined;
    const callerPhone = (params?.caller_phone || body.caller_phone) as string | undefined;
    const notes = (params?.notes || body.notes) as string | undefined;

    if (!businessId || !reservedAt || !serviceType || !callerName) {
      return NextResponse.json({ ok: false, error: "Missing required fields: business_id, reserved_at, service_type, caller_name" }, { status: 400 });
    }

    const result = await createBooking({
      businessId,
      reservedAt,
      serviceType,
      callerName,
      callerPhone,
      notes,
      durationMinutes: 30,
    });

    if (!result.ok) {
      const err = (result as { ok: false; error: string }).error;
      return NextResponse.json({ ok: false, error: err }, { status: 409 });
    }

    await supabaseAdmin.from("notifications").insert({
      business_id: businessId,
      type: "booking",
      title: "Nowa rezerwacja",
      message: `Nowa rezerwacja: ${serviceType} - ${callerName}${callerPhone ? ` (${callerPhone})` : ""} na ${reservedAt}`,
      metadata: {
        reservation_id: result.reservation.id,
        service_type: serviceType,
        caller_name: callerName,
        caller_phone: callerPhone || "",
        reserved_at: reservedAt,
      },
      created_at: new Date().toISOString(),
    });

    (async () => {
      try {
        await sendSlackNotification(businessId, reservationSlackBlocks({
          callerName: callerName || "",
          callerPhone,
          serviceType: serviceType || "",
          reservedAt: reservedAt || "",
          notes,
        }));
      } catch (err) {
        console.error("[create-reservation] slack notification failed:", err);
      }
    })();

    return NextResponse.json({ ok: true, reservation: result.reservation });
  } catch (err) {
    console.error("[create-reservation]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
