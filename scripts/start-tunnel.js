const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const logPath = path.join(process.env.TEMP || __dirname, "cf-tunnel-url.txt");
const cloudflared = path.join(process.env.USERPROFILE, "cloudflared.exe");

fs.writeFileSync(logPath, "");

const proc = spawn(cloudflared, ["tunnel", "--url", "http://localhost:3000"], {
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});

proc.stdout.on("data", (data) => {
  const text = data.toString();
  fs.appendFileSync(logPath, text);
  const match = text.match(/https:\/\/[a-z-]+\.trycloudflare\.com/);
  if (match) {
    fs.appendFileSync(logPath, "\nTUNNEL_URL=" + match[0] + "\n");
  }
});

proc.stderr.on("data", (data) => {
  fs.appendFileSync(logPath, data.toString());
});

proc.on("error", (err) => {
  fs.appendFileSync(logPath, "ERROR: " + err.message + "\n");
});

setTimeout(() => {
  fs.appendFileSync(logPath, "TIMEOUT_REACHED\n");
  process.exit(0);
}, 60000);
