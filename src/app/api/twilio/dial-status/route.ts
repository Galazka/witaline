import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { escapeXml, redirectActiveCallToHumanHandoff } from "@/lib/twilio-utils";

export async function POST(request: Request) {
   try {
     const formData = await request.formData();
     const callStatus = String(formData.get("CallStatus") || "");
     const statusEvent = String(formData.get("StatusCallbackEvent") || "");

     const url = new URL(request.url);
     const callSid = url.searchParams.get("callSid") || "";
     const conferenceName = url.searchParams.get("conference") || "";
     const businessId = url.searchParams.get("businessId") || "";
     const actionUrl = url.searchParams.get("actionUrl") || "";
     const fallbackUrl = url.searchParams.get("fallbackUrl") || "";

     console.log("[dial-status] event:", statusEvent, "callStatus:", callStatus, "callSid:", callSid, "conference:", conferenceName);

     // Save status
     try {
       await supabaseAdmin.from("dial_status").upsert({
         call_sid: callSid,
         queue_name: conferenceName,
         business_id: businessId,
         received_at: new Date().toISOString(),
         status: statusEvent || callStatus || "received"
       });
     } catch (err) {
       console.error("[dial-status] Failed to save status:", err);
     }

     // Consultant answered → caller is already in <Dial><Conference> from transfer-router
     // No redirect needed — caller and consultant will bridge automatically in the same conference
     if (statusEvent === "answered" || callStatus === "in-progress") {
       console.log("[dial-status] CONSULTANT ANSWERED - caller and consultant will bridge in conference", conferenceName);
     }

     // Consultant didn't answer within 15s timeout → redirect caller to fallback (Maja comes back)
     if (statusEvent === "completed") {
       const isNoAnswer = callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed" || callStatus === "canceled";
       if (isNoAnswer) {
         console.log("[dial-status] CONSULTANT DID NOT ANSWER - redirecting caller to fallback");

         if (callSid && fallbackUrl) {
           const fallbackTwiml = `<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`;
           const result = await redirectActiveCallToHumanHandoff(callSid, fallbackTwiml, businessId);
           console.log("[dial-status] fallback redirect result:", result.ok, result.message);
         }
       }
     }

     return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response/>`, {
       status: 200,
       headers: { "Content-Type": "application/xml" }
     });
   } catch (err) {
     const errMsg = err instanceof Error ? err.message : String(err);
     console.error("[dial-status] Error:", errMsg);
     return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response/>`, {
       status: 500,
       headers: { "Content-Type": "application/xml" }
     });
   }
}
