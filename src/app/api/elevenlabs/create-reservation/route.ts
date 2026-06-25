import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createBooking } from "@/lib/calendar";
import { sendSlackNotification, reservationSlackBlocks } from "@/lib/slack-notify";

const reservationSchema = z.object({
  business_id: z.string().uuid(),
  reserved_at: z.string().min(1, "reserved_at is required"),
  service_type: z.string().min(1, "service_type is required"),
  caller_name: z.string().min(1, "caller_name is required"),
  caller_phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const raw = body.parameters
      ? (body.parameters as Record<string, unknown>)
      : {
          ...(body as Record<string, unknown>),
          ...((body.custom_data as Record<string, unknown>) || {}),
        };
    const parsed = reservationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues.map(i => `${i.path}: ${i.message}`).join("; ") }, { status: 400 });
    }

    const { business_id: businessId, reserved_at: reservedAt, service_type: serviceType, caller_name: callerName, caller_phone: callerPhone, notes } = parsed.data;

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
