import { NextResponse } from "next/server";
import { sendWelcomeEmail, sendNewLeadEmail, sendTrialExpiryEmail, sendTrialActivationEmail, sendFirstCallEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { type, to, businessName } = await request.json();

  if (!type || !to) {
    return NextResponse.json({ error: "Missing type and to" }, { status: 400 });
  }

  let result;
  switch (type) {
    case "welcome":
      result = await sendWelcomeEmail(to, businessName || "TestFirma", "start_100");
      break;
    case "lead":
      result = await sendNewLeadEmail(to, businessName || "TestFirma", "Jan Kowalski", "+48 123 456 789", "Pozycjonowanie stron");
      break;
    case "trial":
      result = await sendTrialExpiryEmail(to, businessName || "TestFirma", 3);
      break;
    case "trial-activation":
      result = await sendTrialActivationEmail(to, businessName || "TestFirma", "+48 732 125 752");
      break;
    case "first-call":
      result = await sendFirstCallEmail(to, businessName || "TestFirma", 125);
      break;
    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  return NextResponse.json(result);
}
