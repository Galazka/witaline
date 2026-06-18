import { NextResponse } from "next/server";
import { escapeXml } from "@/lib/twilio-utils";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const room = url.searchParams.get("Room") || "";

  if (!room) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="25">
    <Conference endConferenceOnExit="true" startConferenceOnEnter="true" beep="false">${escapeXml(room)}</Conference>
  </Dial>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}