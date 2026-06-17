// scripts/start.js
// Uruchamia wszystko jednym poleceniem po restarcie kompa:
//   node scripts/start.js
//
// 1. Zabija stare procesy na porcie 3000
// 2. Uruchamia Next.js dev server
// 3. Uruchamia cloudflared tunnel
// 4. Automatycznie wykrywa URL tunelu
// 5. Aktualizuje .env, ElevenLabs, Twilio
// 6. Zapisuje konfigurację do witaline-config.json

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "witaline-config.json");
const TUNNEL_LOG = path.join(process.env.TEMP || ROOT, "cf-start-log.txt");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(TUNNEL_LOG, line + "\n");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killProcess(name) {
  try {
    require("child_process").execSync(`taskkill /F /IM ${name} 2>nul`, { stdio: "ignore" });
  } catch (_) {}
}

async function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
          res.resume();
          resolve();
        });
        req.on("error", reject);
        req.setTimeout(3000, () => { req.destroy(); reject(new Error("timeout")); });
      });
      return true;
    } catch (_) {
      await sleep(2000);
    }
  }
  return false;
}

async function detectTunnelUrl(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Fallback: sprawdź plik z logów
    if (fs.existsSync(TUNNEL_LOG)) {
      const content = fs.readFileSync(TUNNEL_LOG, "utf-8");
      const match = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        log(`Znaleziono URL w logach: ${match[0]}`);
        return match[0];
      }
    }
    // Try metrics endpoint
    try {
      const metrics = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:20241/metrics`, (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => resolve(d));
        }).on("error", reject);
      });
      const match = metrics.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) return match[0];
    } catch (_) {}
    await sleep(3000);
  }
  return null;
}

async function startTunnel() {
  return new Promise((resolve, reject) => {
    const cloudflared = path.join(process.env.USERPROFILE, "cloudflared.exe");
    if (!fs.existsSync(cloudflared)) {
      log(`❌ Nie znaleziono cloudflared.exe w ${cloudflared}`);
      reject(new Error("cloudflared not found"));
      return;
    }
    // Uruchom z przekierowaniem wyjścia do pliku
    const outFile = path.join(process.env.TEMP || ROOT, "cf-stdout.txt");
    const batchScript = `start /B "" "${cloudflared}" tunnel --url http://localhost:3000 > "${outFile}" 2>&1`;
    const cmd = spawn("cmd", ["/c", batchScript], { detached: true, stdio: "ignore" });
    cmd.unref();
    log("Tunnel cloudflared uruchomiony (PID: " + (cmd.pid || "?") + ")");
    resolve();
  });
}

async function main() {
  log("=== WitaLine Start ===");

  // Krok 0: Zabij stare procesy na porcie 3000 (bez samobójstwa)
  log("Zabijam stare procesy na porcie 3000...");
  // Zabij tylko cloudflared — node.exe zostaw (start.js to też node.exe)
  killProcess("cloudflared.exe");
  // Zabij proces zajmujący port 3000
  try {
    const pidOnPort = require("child_process").execSync(
      'powershell -Command "(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess"',
      { encoding: "utf8" }
    ).trim();
    if (pidOnPort) {
      require("child_process").execSync(`taskkill /F /PID ${pidOnPort} 2>nul`, { stdio: "ignore" });
    }
  } catch (_) {}
  await sleep(3000);

  // Krok 1: Uruchom Next.js
  log("Uruchamiam Next.js dev server...");
  const next = spawn("cmd", ["/c", "npx.cmd next dev -p 3000"], {
    cwd: ROOT,
    windowsHide: true,
    detached: true,
    stdio: "ignore",
  });
  next.unref();
  log("Next.js PID: " + (next.pid || "?"));

  const ready = await waitForPort(3000);
  if (!ready) {
    log("❌ Next.js nie wystartował w ciągu 60s");
    process.exit(1);
  }
  log("✅ Next.js dev server gotowy");
  await sleep(5000);

  // Krok 2: Uruchom tunnel
  log("Uruchamiam cloudflared tunnel...");
  await startTunnel();
  await sleep(20000);

  // Krok 3: Wykryj URL tunelu
  log("Wykrywam URL tunelu...");
  const tunnelUrl = await detectTunnelUrl(60000);
  if (!tunnelUrl) {
    log("❌ Nie wykryto URL tunelu — sprawdź czy cloudflared działa");
    process.exit(1);
  }
  log(`✅ URL tunelu: ${tunnelUrl}`);

  // Krok 4: Zaktualizuj konfigurację
  log("Aktualizuję .env i ElevenLabs...");
  const setupScript = path.join(__dirname, "setup-tunnel.js");
  if (fs.existsSync(setupScript)) {
    require("child_process").execSync(`node "${setupScript}" "${tunnelUrl}"`, {
      cwd: ROOT,
      stdio: "inherit",
      timeout: 60000,
    });
  } else {
    log("⚠️ setup-tunnel.js nie znaleziono — pomijam");
  }

  // Krok 5: Zapisz konfigurację (zachowaj stare MCP ID, bo setup-tunnel mógł je zmienić)
  const tunnelUrlFinal = tunnelUrl;
  // Po setup-tunnel.js .env ma już nowy URL, ale MCP ID może być inny — czytamy z config jeśli istnieje
  let existingConfig = {};
  try { existingConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")); } catch (_) {}
  const config = {
    tunnel_url: tunnelUrlFinal,
    mcp_server_id: existingConfig.mcp_server_id || "h36suSdSvQaylNdUh2Uy",
    agent_id: process.env.ELEVENLABS_AGENT_ID || "agent_1501krvm9y90e549tyg96mgczsfv",
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  log(`✅ Konfiguracja zapisana w ${CONFIG_PATH}`);

  // Podsumowanie
  log("");
  log("=== WitaLine Ready ===");
  log(`URL:    ${tunnelUrl}`);
  log(`MCP:    ${tunnelUrl}/api/mcp`);
  log(`Agent:  ${config.agent_id}`);
  log(`MCP ID: ${config.mcp_server_id}`);
  log("======================");
}

main().catch((e) => {
  log("❌ Błąd: " + (e.message || e));
  process.exit(1);
});