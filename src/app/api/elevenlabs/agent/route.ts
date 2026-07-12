import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "";

async function elevenlabsFetch(method: string, body?: unknown) {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method,
    headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API ${res.status}: ${err}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const agent = await elevenlabsFetch("GET");
    const prompt = agent?.conversation_config?.agent?.prompt?.prompt || "";
    return NextResponse.json({ ok: true, prompt, agentName: agent.name || "Maja" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }
    await elevenlabsFetch("PATCH", {
      conversation_config: {
        agent: {
          prompt: { prompt },
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
