const fs = require("fs");
const https = require("https");

function getEnv(key) {
  const content = fs.readFileSync(".env", "utf-8");
  const m = content.match(new RegExp("^" + key + "=(.+)", "m"));
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, "");
}

const apiKey = getEnv("ELEVENLABS_API_KEY");
const agentId = getEnv("ELEVENLABS_AGENT_ID");
const tunnelUrl = "https://snap-pipes-mary-tribal.trycloudflare.com";

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "api.elevenlabs.io",
      path: "/v1" + path,
      method,
      headers: {
        "xi-api-key": apiKey,
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
        } catch (e) {
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
  console.log("1. Creating new call-completed webhook...");
  const whRes = await api("POST", "/workspace/webhooks", {
    name: "call-completed",
    target_url: tunnelUrl + "/api/elevenlabs/call-completed",
    events: ["call_completed"],
    settings: {
      auth_type: "hmac",
      name: "call-completed",
      webhook_url: tunnelUrl + "/api/elevenlabs/call-completed",
    },
  });
  console.log("   Status:", whRes.status, JSON.stringify(whRes.data).slice(0, 200));

  // Try alternative format
  console.log("\n2. Trying alt format...");
  const whRes2 = await api("POST", "/workspace/webhooks", {
    name: "call-completed-v2",
    target_url: tunnelUrl + "/api/elevenlabs/call-completed",
    events: ["post_call"],
    auth_type: "hmac",
  });
  console.log("   Status:", whRes2.status, JSON.stringify(whRes2.data).slice(0, 200));

  // Try setting webhook_overrides directly on agent
  console.log("\n3. Setting webhook_overrides on agent...");
  const patchRes = await api("PATCH", "/convai/agents/" + agentId, {
    conversation_config: {
      webhook_overrides: {
        call_completed_url: tunnelUrl + "/api/elevenlabs/call-completed",
        client_data_url: tunnelUrl + "/api/elevenlabs/client-data",
      },
    },
  });
  console.log("   Status:", patchRes.status, JSON.stringify(patchRes.data).slice(0, 500));

  // Try setting enable_conversation_initiation_client_data_from_webhook
  console.log("\n4. Setting enable_conversation_initiation_client_data_from_webhook...");
  const patchRes2 = await api("PATCH", "/convai/agents/" + agentId, {
    overrides: {
      enable_conversation_initiation_client_data_from_webhook: true,
    },
  });
  console.log("   Status:", patchRes2.status, JSON.stringify(patchRes2.data).slice(0, 200));

  // Try workspace_overrides
  console.log("\n5. Setting workspace_overrides...");
  const patchRes3 = await api("PATCH", "/convai/agents/" + agentId, {
    workspace_overrides: {
      conversation_initiation_client_data_webhook: {
        url: tunnelUrl + "/api/elevenlabs/client-data",
        request_headers: { "Content-Type": "application/json" },
      },
    },
  });
  console.log("   Status:", patchRes3.status, JSON.stringify(patchRes3.data).slice(0, 200));
}

main().catch((e) => console.error("Error:", e.message));
