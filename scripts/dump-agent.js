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

    // Check workspace_overrides
    const wo = j.workspace_overrides;
    console.log("=== workspace_overrides ===");
    console.log(JSON.stringify(wo, null, 2));

    // Check overrides
    const ov = j.overrides;
    console.log("\n=== overrides ===");
    console.log(JSON.stringify(ov, null, 2));

    // Check webhook_overrides in conversation_config
    const wh = j.conversation_config?.webhook_overrides;
    console.log("\n=== webhook_overrides (in conversation_config) ===");
    console.log(JSON.stringify(wh, null, 2));

    console.log("\n=== agent keys ===");
    console.log(Object.keys(j).join(", "));
  });
});
