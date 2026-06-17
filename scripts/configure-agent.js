const https = require("https");
const fs = require("fs");
const path = require("path");

// Read .env
const envPath = path.join(__dirname, "..", ".env");
const envRaw = fs.readFileSync(envPath, "utf-8");
const env = {};
envRaw.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
});

const key = env.ELEVENLABS_API_KEY;
const tsid = env.TWILIO_ACCOUNT_SID;
const ttok = env.TWILIO_AUTH_TOKEN;
const tunnel = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const agentId = env.ELEVENLABS_AGENT_ID || "agent_1501krvm9y90e549tyg96mgczsfv";

if (!key) {
  console.error("❌ No ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

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
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, data: d });
        }
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
  console.log("Key length:", key.length);

  // 1. Get agent info
  const agent = await api("GET", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`);
  if (agent.status === 200) {
    console.log("✅ Agent found:", agent.data.name || agent.data.display_name || agent.data.agent_name);
  } else {
    console.log("❌ Cannot fetch agent:", agent.status, JSON.stringify(agent.data).slice(0, 200));
    process.exit(1);
  }

  // 2. Update Twilio config + webhooks
  const patchBody = {
    conversation_config: {
      agent: {
        twilio: {
          account_sid: tsid,
          auth_token: ttok,
        },
      },
      webhook_overrides: {
        call_completed_url: `${tunnel}/api/elevenlabs/call-completed`,
        client_data_url: `${tunnel}/api/elevenlabs/client-data`,
      },
    },
  };

  console.log("Patching with:", JSON.stringify(patchBody, null, 2).slice(0, 500));

  const res = await api("PATCH", "api.elevenlabs.io", `/v1/convai/agents/${agentId}`, patchBody);
  if (res.status === 200) {
    console.log("✅ Twilio config + webhooks SET successfully");
  } else {
    console.log("❌ Failed:", res.status, JSON.stringify(res.data).slice(0, 500));
  }
}

main().catch((e) => console.error(e));
