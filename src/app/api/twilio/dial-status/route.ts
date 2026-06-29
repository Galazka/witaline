import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { escapeXml } from "@/lib/twilio-utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = String(formData.get("callSid") || "");
    const queue = String(formData.get("queue") || "");
    const businessId = String(formData.get("businessId") || "");
    
    console.log("[dial-status] Received call sid:", callSid, "queue:", queue, "businessId:", businessId);
    
    // Save status to database or log it for analysis
    try {
      await supabaseAdmin.from("dial_status").upsert({
        call_sid: callSid,
        queue_name: queue,
        business_id: businessId,
        received_at: new Date().toISOString(),
        status: "received"
      });
    } catch (err) {
      console.error("[dial-status] Failed to save status:", err);
    }
    
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Status ricevuto.</Say><Hangup/></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" }
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[dial-status] Error:", errMsg);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pl-PL">Errore.</Say><Hangup/></Response>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" }
    });
  }
}