const fs = require("fs");
const https = require("https");

function getEnv(key) {
  const content = fs.readFileSync(".env", "utf-8");
  const m = content.match(new RegExp("^" + key + "=(.+)", "m"));
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, "");
}

const apiKey = getEnv("ELEVENLABS_API_KEY");

https.get("https://api.elevenlabs.io/v1/workspace/webhooks", { headers: { "xi-api-key": apiKey } }, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    try {
      const j = JSON.parse(data);
      console.log(JSON.stringify(j, null, 2));
    } catch (e) {
      console.log("Raw:", data.slice(0, 1000));
    }
  });
});
