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

https.get("https://api.elevenlabs.io/v1/convai/agents/" + agentId, { headers: { "xi-api-key": apiKey } }, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    const j = JSON.parse(data);
    const wh = j.workspace_overrides?.conversation_initiation_client_data_webhook;
    console.log("client-data URL:", wh?.url);
    console.log("enable_conversation_initiation_client_data_from_webhook:", j.overrides?.enable_conversation_initiation_client_data_from_webhook);
  });
});
