import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = form.get("From") as string;
  // Prosty spam-check (placeholder)
  const suspicious = false; // Tutaj sprawdź numer
  if (suspicious) return new NextResponse("blocked", { status: 403 });
  // Przekieruj do agenta
  return NextResponse.redirect(`https://api.elevenlabs.io/v1/convai/twilio/register-call`);
}
