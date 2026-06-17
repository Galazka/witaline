import { supabaseAdmin } from "@/lib/supabase-admin";
import { twiml, escapeXml } from "@/lib/twilio-utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const callerNumber = formData.get("From") as string || "";
  const speechResult = formData.get("SpeechResult") as string || "";
  const callSid = formData.get("CallSid") as string || "";

  const { error } = await supabaseAdmin
    .from("callback_requests")
    .insert({
      caller_number: callerNumber,
      matter: speechResult,
      call_sid: callSid,
    });

  if (error) {
    console.error("Failed to save callback request:", error);
  }

  const matterText = speechResult
    ? `Opis: ${escapeXml(speechResult)}.`
    : "";

  return twiml(`
    <Say language="pl-PL">Dziękujemy. Twoja prośba o oddzwonienie została zapisana. ${matterText} Skontaktujemy się w ciągu 24 godzin. Do widzenia.</Say>
    <Hangup/>
  `);
}
