import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = String(formData.get("CallSid") || "");
    const dialCallStatus = String(formData.get("DialCallStatus") || "");
    const called = String(formData.get("Called") || "");
    const caller = String(formData.get("Caller") || "");
    const answeredBy = String(formData.get("AnsweredBy") || "");
    
    console.log("[human-handoff-status] callSid:", callSid, "status:", dialCallStatus, "answeredBy:", answeredBy);
    
    try {
      await supabaseAdmin.from("human_handoff_status").upsert({
        call_sid: callSid,
        dial_call_status: dialCallStatus,
        called,
        caller,
        answered_by: answeredBy,
        received_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("[human-handoff-status] Failed to save:", err);
    }
    
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[human-handoff-status] Error:", errMsg);
    return new NextResponse(null, { status: 500 });
  }
}