const fs = require("fs");
const https = require("https");

const envRaw = fs.readFileSync(".env", "utf-8");
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
const tunnel = "https://subtle-notify-driven-competitive.trycloudflare.com";

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
        try { resolve({ s: res.statusCode, d: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, d }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. List existing workspace webhooks
  const existing = await api("GET", "api.elevenlabs.io", "/v1/workspace/webhooks");
  console.log("Existing workspace webhooks:");
  for (const w of existing.d?.webhooks || []) {
    const oldUrl = w.webhook_url || "";
    const newUrl = oldUrl.replace(/https:\/\/[^\/]+/, tunnel);
    console.log(`  ${w.webhook_id}: ${w.name} → ${oldUrl}`);
    if (oldUrl !== newUrl && oldUrl.includes("trycloudflare.com")) {
      const upd = await api("PATCH", "api.elevenlabs.io", `/v1/workspace/webhooks/${w.webhook_id}`, { webhook_url: newUrl });
      console.log(`  ✅ Updated to: ${newUrl} (${upd.s})`);
    }
  }

  // 2. Update existing webhooks via delete + recreate (PATCH doesn't work for URL updates)
  for (const w of existing.d?.webhooks || []) {
    const oldUrl = w.webhook_url || "";
    const newUrl = oldUrl.replace(/https:\/\/[^\/]+/, tunnel);
    if (oldUrl !== newUrl && oldUrl.includes("trycloudflare.com")) {
      console.log(`  Replacing ${w.name}: ${oldUrl} → ${newUrl}`);
      await api("DELETE", "api.elevenlabs.io", `/v1/workspace/webhooks/${w.webhook_id}`);
      const created = await api("POST", "api.elevenlabs.io", "/v1/workspace/webhooks", {
        name: w.name || w.webhook_id,
        target_url: newUrl,
        events: w.name && w.name.includes("transcrib") ? ["post_call_transcription"] : ["post_call_transcription"],
        settings: {},
      });
      console.log(`  ${created.s === 200 || created.s === 201 ? "✅" : "❌"} ${created.s} ${JSON.stringify(created.d).slice(0, 100)}`);
    }
  }
  console.log("\nChecking for client-data webhook...");
  const hasClientData = (existing.d?.webhooks || []).some(
    (w) => w.webhook_url && w.webhook_url.includes("/api/elevenlabs/client-data")
  );
  if (!hasClientData) {
    const created = await api("POST", "api.elevenlabs.io", "/v1/workspace/webhooks", {
      name: "client-data",
      target_url: tunnel + "/api/elevenlabs/client-data",
      events: ["conversation_initiation_client_data"],
      settings: {},
    });
    console.log(`  Created client-data webhook: ${created.s} ${JSON.stringify(created.d).slice(0, 200)}`);
  } else {
    console.log("  ✅ client-data webhook already exists");
  }

  // 3. Verify the workspace webhooks
  console.log("\nFinal state:");
  const final = await api("GET", "api.elevenlabs.io", "/v1/workspace/webhooks");
  for (const w of final.d?.webhooks || []) {
    console.log(`  ${w.name}: ${w.webhook_url} (enabled: ${!w.is_disabled})`);
  }
}

main().catch((e) => console.error("Error:", e.message));
