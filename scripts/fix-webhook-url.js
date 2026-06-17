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

if (!apiKey || !agentId) {
  console.error("Missing ElevenLabs credentials");
  process.exit(1);
}

const body = JSON.stringify({
  workspace_overrides: {
    conversation_initiation_client_data_webhook: {
      url: "https://snap-pipes-mary-tribal.trycloudflare.com/api/elevenlabs/client-data",
      request_headers: { "Content-Type": "application/json" },
    },
  },
  overrides: {
    enable_conversation_initiation_client_data_from_webhook: true,
  },
});

const opts = {
  hostname: "api.elevenlabs.io",
  path: "/v1/convai/agents/" + agentId,
  method: "PATCH",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = https.request(opts, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    try {
      const d = JSON.parse(data);
      const wh = d.workspace_overrides?.conversation_initiation_client_data_webhook;
      console.log("Response status:", res.statusCode);
      console.log("client-data URL:", wh?.url || "N/A");
      console.log("overrides enable_conversation_initiation_client_data_from_webhook:", d.overrides?.enable_conversation_initiation_client_data_from_webhook);
      console.log("Done.");
    } catch (e) {
      console.log("Status:", res.statusCode);
      console.log("Raw:", data.slice(0, 500));
    }
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

req.write(body);
req.end();
