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

     // Consultant answered → redirect caller from hold music to conference
     if (statusEvent === "answered" || callStatus === "in-progress") {
       console.log("[dial-status] CONSULTANT ANSWERED - redirecting caller", callSid, "to conference", conferenceName);

       if (callSid && actionUrl) {
         const conferenceTwiml = `
<Dial action="${escapeXml(actionUrl)}" method="POST" timeout="30">
  <Conference endConferenceOnExit="true">${escapeXml(conferenceName)}</Conference>
</Dial>
<Redirect method="POST">${escapeXml(fallbackUrl)}</Redirect>`;

         const result = await redirectActiveCallToHumanHandoff(callSid, conferenceTwiml, businessId);
         console.log("[dial-status] redirect result:", result.ok, result.message);
       } else {
         console.warn("[dial-status] missing callSid or actionUrl, cannot redirect");
       }
     }

     // Consultant didn't answer → redirect caller to fallback (Maja comes back)
     if (statusEvent === "completed" && callStatus !== "in-progress" && callStatus !== "completed") {
       const dialResult = String(formData.get("DialCallStatus") || "");
       if (dialResult === "no-answer" || dialResult === "busy" || dialResult === "failed") {
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
