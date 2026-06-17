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
const newWebhookId = "cf8928a20790452c91d8120de86ea46e";

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
  // Set post_call_webhook_id
  console.log("Setting post_call_webhook_id to", newWebhookId);
  const res = await api("PATCH", "/convai/agents/" + agentId, {
    workspace_overrides: {
      webhooks: {
        post_call_webhook_id: newWebhookId,
        events: ["post_call"],
      },
    },
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data).slice(0, 300));

  // Update .env with new webhook secret
  console.log("\nUpdating .env with new webhook secret...");
  let envContent = fs.readFileSync(".env", "utf-8");
  const newSecret = "wsec_ada18683092fcc0bde6e3950ffde684d3d1e573e9a56349bf062cf16d628e91b";
  if (envContent.includes("ELEVENLABS_WEBHOOK_SECRET=")) {
    envContent = envContent.replace(/^ELEVENLABS_WEBHOOK_SECRET=.*$/m, "ELEVENLABS_WEBHOOK_SECRET=" + newSecret);
  } else {
    envContent += "\nELEVENLABS_WEBHOOK_SECRET=" + newSecret;
  }
  fs.writeFileSync(".env", envContent, "utf-8");
  console.log("ELEVENLABS_WEBHOOK_SECRET updated in .env");

  // Verify by listing webhooks again
  console.log("\nVerifying workspace webhooks...");
  const listRes = await api("GET", "/workspace/webhooks");
  if (listRes.status === 200) {
    const whs = listRes.data.webhooks || [];
    whs.forEach((w) => {
      console.log(" -", w.name, "->", w.webhook_url, "| id:", w.webhook_id, "| disabled:", w.is_disabled);
    });
  }
}

main().catch((e) => console.error("Error:", e.message));
