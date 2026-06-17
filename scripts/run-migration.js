const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

function getEnv(filePath, key) {
  const content = fs.readFileSync(filePath, "utf-8");
  const m = content.match(new RegExp("^" + key + "=(.+)", "m"));
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, "");
}

const envPath = ".env";
const url = getEnv(envPath, "NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv(envPath, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);
const sql = fs.readFileSync("scripts/migrations/022-add-elevenlabs-conversation-id.sql", "utf-8");
console.log("Running migration...");

supabase.rpc("pg_query", { query: sql }).then((r) => {
  console.log("Result:", JSON.stringify(r, null, 2));
  process.exit(0);
}).catch((e) => {
  console.error("pg_query RPC error:", e.message);
  console.log("Trying REST API approach...");
  const https = require("https");
  const body = JSON.stringify({ query: sql });
  const hostname = new URL(url).hostname;
  const opts = {
    hostname,
    path: "/rest/v1/rpc/pg_query",
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };
  const req = https.request(opts, (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => {
      console.log("REST status:", res.statusCode, "body:", d.slice(0, 500));
      process.exit(0);
    });
  });
  req.on("error", (e2) => {
    console.error("REST error:", e2.message);
    process.exit(1);
  });
  req.write(body);
  req.end();
});
