import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const body = formData
    ? Object.fromEntries(formData.entries())
    : await request.json().catch(() => ({}));

  console.log("[conference-status] event:", body.ConferenceEvent || "unknown", "room:", body.FriendlyName || body.RoomName || "", "caller:", body.Caller || "");

  const roomName = (body.FriendlyName || body.RoomName || "") as string;
  const event = (body.ConferenceEvent || body.StatusCallbackEvent || "") as string;
  const callSid = (body.CallSid || "") as string;
  const caller = (body.Caller || "") as string;

  if (event === "participant-leave" && roomName) {
    const { data: consultCalls } = await supabaseAdmin
      .from("call_logs")
      .select("id")
      .eq("twilio_call_sid", callSid)
      .maybeSingle();

    if (!consultCalls) {
      await supabaseAdmin.from("notifications").insert({
        business_id: "00000000-0000-0000-0000-000000000001",
        type: "call",
        title: "Konferencja zakonczona",
        message: `Uczestnik ${caller || callSid} opuscil konferencje ${roomName}`,
      }).maybeSingle();
    }
  }

  return new NextResponse(null, { status: 200 });
}
