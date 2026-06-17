const https = require("https");
const body = JSON.stringify({ query: "WitaLine" });
const opts = {
  method: "POST",
  hostname: "kitchen-carrier-newton-jar.trycloudflare.com",
  path: "/api/elevenlabs/business-lookup",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};
const req = https.request(opts, (res) => {
  let d = "";
  res.on("data", (c) => (d += c));
  res.on("end", () => console.log(res.statusCode, d.substring(0, 200)));
});
req.write(body);
req.end();
