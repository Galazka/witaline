import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createBooking } from "@/lib/calendar";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const statusFilter = searchParams.get("status");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  let query = supabase
    .from("reservations")
    .select("*")
    .eq("business_id", businessId)
    .order("reserved_at", { ascending: false });

  if (statusFilter && ["pending", "confirmed", "cancelled", "completed"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  if (fromDate) query = query.gte("reserved_at", fromDate);
  if (toDate) query = query.lte("reserved_at", toDate + "T23:59:59Z");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { business_id, caller_name, caller_phone, service_type, reserved_at, duration_minutes, notes } = body;

  if (!business_id || !service_type || !reserved_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Determine role — staff or admin
  const { data: staff } = await supabase
    .from("business_staff")
    .select("role")
    .eq("business_id", business_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const createdByType = staff ? "staff" : "admin";

  const result = await createBooking({
    businessId: business_id,
    reservedAt: reserved_at,
    serviceType: service_type,
    callerName: caller_name || "Nieznany",
    callerPhone: caller_phone,
    notes,
    durationMinutes: duration_minutes || 30,
    createdByType,
    createdByUserId: user.id,
  });

  if (!result.ok) {
    const err = (result as { ok: false; error: string }).error;
    return NextResponse.json({ error: err }, { status: 409 });
  }

  return NextResponse.json(result.reservation, { status: 201 });
}
