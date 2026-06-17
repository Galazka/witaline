const http = require("http");
const body = JSON.stringify({ query: "WitaLine" });
const opts = {
  method: "POST",
  hostname: "localhost",
  port: 3000,
  path: "/api/elevenlabs/business-lookup",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
};
const req = http.request(opts, (res) => {
  let d = "";
  res.on("data", (c) => (d += c));
  res.on("end", () => console.log(res.statusCode, d));
});
req.write(body);
req.end();
