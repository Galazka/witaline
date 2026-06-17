import { NextResponse } from "next/server";
import { createBooking } from "@/lib/calendar";
import { addNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const body = await request.json();

  const { business_id, reserved_at, service_type, caller_name, caller_phone, notes } = body;

  if (!business_id || !reserved_at || !service_type || !caller_name) {
    return NextResponse.json({ error: "Brak wymaganych pól: business_id, reserved_at, service_type, caller_name." }, { status: 400 });
  }

  const result = await createBooking({
    businessId: business_id,
    reservedAt: reserved_at,
    serviceType: service_type,
    callerName: caller_name,
    callerPhone: caller_phone || undefined,
    notes: notes || undefined,
  });

  if (!result.ok) {
    const status = result.error.includes("zajęty") ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  await addNotification({
    businessId: business_id,
    type: "booking",
    title: "Nowa rezerwacja online",
    message: `${caller_name} zarezerwował(a) "${service_type}" na ${new Date(reserved_at).toLocaleString("pl-PL")}`,
    metadata: { reservation_id: result.reservation.id },
  });

  return NextResponse.json({ ok: true, reservation: result.reservation });
}
