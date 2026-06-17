import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_SEC = 15;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = (formData.get("CallSid") as string) || "";
    const callStatus = (formData.get("CallStatus") as string) || "";
    const room = request.nextUrl.searchParams.get("room") || "";

    console.log("[transfer-status] callback:", { callSid, callStatus, room });

    if (!room) {
      console.log("[transfer-status] no room in query, skipping");
      return NextResponse.json({ ok: true });
    }

    if (callStatus === "in-progress") {
      await supabaseAdmin
        .from("transfer_queue")
        .update({ status: "connected", updated_at: new Date().toISOString() })
        .eq("conference_room", room);
      console.log("[transfer-status] consultant answered, connected:", room);
      return NextResponse.json({ ok: true });
    }

    if (callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed") {
      const { data: queue } = await supabaseAdmin
        .from("transfer_queue")
        .select("*")
        .eq("conference_room", room)
        .in("status", ["waiting", "ringing"])
        .maybeSingle();

      if (!queue) {
        console.log("[transfer-status] no active queue entry for room:", room);
        return NextResponse.json({ ok: true });
      }

      const newAttempts = (queue.attempts || 0) + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        await supabaseAdmin
          .from("transfer_queue")
          .update({ status: "expired", attempts: newAttempts, updated_at: new Date().toISOString() })
          .eq("id", queue.id);
        console.log("[transfer-status] max attempts reached, queue expired:", room);
        return NextResponse.json({ ok: true });
      }

      await supabaseAdmin
        .from("transfer_queue")
        .update({ status: "waiting", attempts: newAttempts, updated_at: new Date().toISOString() })
        .eq("id", queue.id);

      // Retry after delay
      setTimeout(async () => {
        try {
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;
          const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          if (!sid || !token || !twilioNumber || !queue.consultant_phone) return;

          const auth = Buffer.from(`${sid}:${token}`).toString("base64");
          const roomNameSafe = room.replace(/[^a-zA-Z0-9_-]/g, "");
          const consulTwiml = `<Response><Dial><Conference endConferenceOnExit="false">${roomNameSafe}</Conference></Dial></Response>`;
          const callbackUrl = `${appUrl}/api/twilio/transfer-status?room=${room}`;

          const body = new URLSearchParams({
            To: queue.consultant_phone,
            From: twilioNumber,
            Twiml: consulTwiml,
            Timeout: "30",
            StatusCallback: callbackUrl,
            StatusCallbackEvent: "initiated+ringing+answered+completed",
          });

          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
            method: "POST",
            headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });

          if (res.ok) {
            const d = await res.json();
            console.log("[transfer-status] retry call initiated:", d.sid, "for room:", room);
            await supabaseAdmin
              .from("transfer_queue")
              .update({ status: "ringing", updated_at: new Date().toISOString() })
              .eq("id", queue.id);
          }
        } catch (e) {
          console.error("[transfer-status] retry error:", e);
        }
      }, RETRY_DELAY_SEC * 1000);

      return NextResponse.json({ ok: true, retry_at: `+${RETRY_DELAY_SEC}s` });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[transfer-status] error:", e);
    return NextResponse.json({ ok: true });
  }
}
