const fs = require("fs");
const https = require("https");
const path = require("path");

const envRaw = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf-8");
const env = {};
envRaw.split("\n").forEach((line) => {
  const i = line.indexOf("=");
  if (i > 0) {
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
});

const key = env.ELEVENLABS_API_KEY;
const tunnel = env.NEXT_PUBLIC_APP_URL || "https://subtle-notify-driven-competitive.trycloudflare.com";
const agentId = env.ELEVENLABS_AGENT_ID;

function api(method, hostname, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname,
      path: apiPath,
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ s: res.statusCode, d: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, d }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Tunnel:", tunnel);
  console.log("Agent:", agentId);

  // Step 1: Get current agent config
  const agent = await api("GET", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`);
  console.log("Agent:", agent.d?.name);

  // Step 2: Try PATCH with just the webhook_overrides at conversation_config level
  console.log("\nStep 2: Setting webhook_overrides in conversation_config...");
  const result = await api("PATCH", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`, {
    conversation_config: {
      webhook_overrides: {
        client_data_url: `${tunnel}/api/elevenlabs/client-data`,
        call_completed_url: `${tunnel}/api/elevenlabs/call-completed`,
      },
    },
  });
  console.log("PATCH status:", result.s);
  if (result.s !== 200) console.log("Error:", JSON.stringify(result.d).slice(0, 300));

  // Step 3: Verify
  console.log("\nStep 3: Verifying...");
  const verify = await api("GET", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`);
  const cfg = verify.d?.conversation_config || {};
  console.log("webhook_overrides:", JSON.stringify(cfg.webhook_overrides));
  console.log("has webhooks:", cfg.webhook_overrides ? "✅ YES" : "❌ NO");

  if (!cfg.webhook_overrides) {
    // Step 4: Try with the full agent config merge
    console.log("\nStep 4: Trying full config merge...");
    const currentConfig = agent.d?.conversation_config || {};
    const mergeResult = await api("PATCH", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`, {
      conversation_config: {
        ...currentConfig,
        webhook_overrides: {
          client_data_url: `${tunnel}/api/elevenlabs/client-data`,
          call_completed_url: `${tunnel}/api/elevenlabs/call-completed`,
        },
      },
    });
    console.log("Merge status:", mergeResult.s);
    if (mergeResult.s !== 200) console.log("Error:", JSON.stringify(mergeResult.d).slice(0, 300));

    const verify2 = await api("GET", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`);
    const cfg2 = verify2.d?.conversation_config || {};
    console.log("webhook_overrides after merge:", JSON.stringify(cfg2.webhook_overrides));
  }
}

main().catch((e) => console.error("Error:", e.message));
