import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json({ error: "Missing ElevenLabs credentials" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs token error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to get conversation token" }, { status: 500 });
    }

    const { token } = await response.json();
    return NextResponse.json({ token, agentId });
  } catch (error) {
    console.error("Failed to fetch ElevenLabs token:", error);
    return NextResponse.json({ error: "Failed to get conversation token" }, { status: 500 });
  }
}
