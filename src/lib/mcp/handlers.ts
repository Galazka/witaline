import { ToolName } from "./tools";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
    process.env.APP_URL ||
    "http://localhost:3000";
}

async function callInternalApi(
  toolName: ToolName,
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[] }> {
  const path = toolName === "transfer_to_human"
    ? "/api/elevenlabs/transfer-human"
    : `/api/elevenlabs/${toolName.replace(/_/g, "-")}`;

  const body: Record<string, unknown> = { ...args };

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const text = JSON.stringify(data, null, 2);

    return {
      content: [{ type: "text", text }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }),
        },
      ],
    };
  }
}

export async function handleToolCall(
  toolName: ToolName,
  args: Record<string, unknown>
) {
  return callInternalApi(toolName, args);
}
