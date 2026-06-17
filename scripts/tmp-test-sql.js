const https = require("https");

const supabaseUrl = "ukjeyrjbhwnuqznukmzk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramV5cmpiaHdudXF6bnVrbXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMDkyMCwiZXhwIjoyMDk1ODc2OTIwfQ.yw3tlCFOlbhK2wrusYXl9JPLO5U_ZAESGe_5CD0PYhk";

function query(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const opts = {
      method: "POST",
      hostname: supabaseUrl,
      path: "/rest/v1/rpc/pgclient_sql",
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + supabaseKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, data: d }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const sql = "SELECT 1 AS test";
  const result = await query(sql);
  console.log("Status:", result.status, "Data:", result.data.substring(0, 200));
}

main().catch(console.error);
