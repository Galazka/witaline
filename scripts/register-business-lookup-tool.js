const https = require("https");
const fs = require("fs");
const path = require("path");

// Load .env manually
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[key] = value;
});

const TUNNEL_URL = envVars.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
const API_KEY = envVars.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
const AGENT_ID = envVars.ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID;

if (!TUNNEL_URL) {
  console.error("ERROR: NEXT_PUBLIC_APP_URL is not set");
  process.exit(1);
}
if (!API_KEY) {
  console.error("ERROR: ELEVENLABS_API_KEY is not set");
  process.exit(1);
}
if (!AGENT_ID) {
  console.error("ERROR: ELEVENLABS_AGENT_ID is not set");
  process.exit(1);
}

const BASE_URL = "https://api.elevenlabs.io/v1";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + path;
    const url = new URL(fullUrl);
    const opts = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log(`Tunnel URL: ${TUNNEL_URL}`);
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log("");

  // 1. Register the webhook tool
  console.log("Registering business_lookup webhook tool...");
  const toolPayload = {
    tool_config: {
      type: "webhook",
      name: "business_lookup",
      description:
        "Search for a business registered with WitaLine by name or DTMF code. Returns business details and system prompt if found. Use this when a caller wants to connect to a specific business.",
      response_timeout_secs: 10,
      api_schema: {
        url: `${TUNNEL_URL}/api/elevenlabs/business-lookup`,
        method: "POST",
        request_body_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The business name (e.g. 'Kowalski i Syn') or DTMF code (e.g. '123') to search for",
            },
          },
          required: ["query"],
        },
      },
    },
  };

  const toolRes = await request("POST", "/convai/tools", toolPayload);
  if (toolRes.status !== 200 && toolRes.status !== 201) {
    console.error("Failed to create tool:", toolRes.status, JSON.stringify(toolRes.data, null, 2));
    process.exit(1);
  }

  const toolId = toolRes.data.tool_id || toolRes.data.id;
  if (!toolId) {
    console.error("No tool_id in response:", JSON.stringify(toolRes.data, null, 2));
    process.exit(1);
  }
  console.log(`Created tool with id: ${toolId}`);

  // 2. Get current agent config
  console.log("Fetching agent config...");
  const agentRes = await request("GET", `/convai/agents/${AGENT_ID}`);
  if (agentRes.status !== 200) {
    console.error("Failed to get agent:", agentRes.status, JSON.stringify(agentRes.data, null, 2));
    process.exit(1);
  }

  const agent = agentRes.data;
  const prompt = agent.conversation_config?.agent?.prompt || {};
  const existingTools = prompt.tool_ids || [];
  if (existingTools.includes(toolId)) {
    console.log("Tool already attached to agent, nothing to do.");
    console.log(`\nTool ID: ${toolId}`);
    return;
  }

  // 3. Patch agent with new tool_ids
  console.log("Attaching tool to agent...");
  const newToolIds = [...existingTools, toolId];
  const patchRes = await request("PATCH", `/convai/agents/${AGENT_ID}`, {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: newToolIds,
        },
      },
    },
  });

  if (patchRes.status !== 200) {
    console.error("Failed to patch agent:", patchRes.status, JSON.stringify(patchRes.data, null, 2));
    process.exit(1);
  }

  console.log("Tool attached to agent successfully!");
  console.log(`\nTool ID: ${toolId}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
