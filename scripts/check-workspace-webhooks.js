const https = require("https");
const fs = require("fs");
const envRaw = fs.readFileSync(".env", "utf-8");
const env = {};
envRaw.split("\n").forEach(line => {
  const t = line.trim(); if (!t || t.startsWith("#")) return;
  const i = t.indexOf("="); if (i === -1) return;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
});
const key = env.ELEVENLABS_API_KEY;

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { method, hostname: "api.elevenlabs.io", path,
      headers: { "xi-api-key": key, "Content-Type": "application/json" } };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const req = https.request(opts, res => { let d = ""; res.on("data", c => d += c); res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); });
    req.on("error", reject); if (data) req.write(data); req.end();
  });
}

async function main() {
  // Try workspace-level webhook API
  const wh = await api("GET", "/v1/workspace/webhooks/settings");
  console.log("Workspace webhook settings:", JSON.stringify(wh, null, 2).slice(0, 3000));
}

main().catch(e => console.error(e));
