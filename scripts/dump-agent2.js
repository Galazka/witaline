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

    // Check conversation_config for webhook overrides
    const cc = j.conversation_config || {};
    console.log("=== conversation_config keys ===");
    console.log(Object.keys(cc).join(", "));

    // Check if workspace_overrides is in conversation_config
    console.log("\n=== workspace_overrides in conversation_config ===");
    console.log(JSON.stringify(cc.workspace_overrides, null, 2));

    // Check webhook_overrides
    console.log("\n=== webhook_overrides in conversation_config ===");
    console.log(JSON.stringify(cc.webhook_overrides, null, 2));

    // Check prompt for client_data
    const agent = cc.agent || {};
    const prompt = agent.prompt || {};
    console.log("\n=== prompt keys ===");
    console.log(Object.keys(prompt).join(", "));
  });
});
