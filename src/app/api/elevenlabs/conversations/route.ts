import { NextResponse } from "next/server";

async function fetchWithRetry(url: string, apiKey: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers: { "xi-api-key": apiKey } });
    if (res.ok || i === retries) return res;
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw new Error("Fetch failed after retries");
}

async function batchFetch<T>(
  items: { conversation_id: string }[],
  apiKey: string,
  concurrency = 5
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        const res = await fetchWithRetry(
          `https://api.elevenlabs.io/v1/convai/conversations/${item.conversation_id}`,
          apiKey
        );
        if (res.ok) {
          const detail = await res.json() as T;
          results.set(item.conversation_id, detail);
        }
      } catch { /* skip failed */ }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function GET(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id") || process.env.ELEVENLABS_AGENT_ID;
  const pageSize = url.searchParams.get("page_size") || "20";

  if (!agentId) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&page_size=${pageSize}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `ElevenLabs API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const conversations = data.conversations || [];

    const details = await batchFetch<{
      metadata?: { phone_call?: { external_number?: string; agent_number?: string } };
    }>(conversations, apiKey, 5);

    const enriched = conversations.map((c: { conversation_id: string }) => {
      const detail = details.get(c.conversation_id);
      const phone = detail?.metadata?.phone_call?.external_number || null;
      const agentNumber = detail?.metadata?.phone_call?.agent_number || null;
      return { ...c, caller_number: phone, agent_number: agentNumber };
    });

    return NextResponse.json({ conversations: enriched });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
