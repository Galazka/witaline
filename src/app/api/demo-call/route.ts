import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await request.json();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Initiate a test call via ElevenLabs API
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return NextResponse.json({
      message: "Demo: rozmowa symulowana",
      instructions: [
        "Zadzwoń na numer testowy przypisany do Twojego agenta",
        "Lub skonfiguruj widget na swojej stronie",
        "Asystent odpowie na pytania o Twoją firmę",
        "Po rozmowie zobaczysz transkrypcję w panelu Połączenia",
      ],
    });
  }

  // Get the phone number associated with this agent
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
    );
    const agent = await res.json();

    return NextResponse.json({
      message: "Twój asystent AI jest gotowy do testu!",
      phoneNumber: agent?.phone_number || "Skonfiguruj numer w ElevenLabs",
      instructions: [
        "Zadzwoń na powyższy numer, aby przetestować asystenta",
        "Zapytaj o godziny otwarcia, menu, lub zarezerwuj termin",
        "Po rozmowie wróć do panelu Połączenia, aby zobaczyć podsumowanie",
      ],
    });
  } catch {
    return NextResponse.json({
      message: "Demo: asystent aktywny",
      instructions: [
        "Twój agent AI jest skonfigurowany i czeka na rozmowy",
        "Przypisz numer telefonu w panelu ElevenLabs",
        "Lub użyj widgetu na swojej stronie www",
      ],
    });
  }
}





