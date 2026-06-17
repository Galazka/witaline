// scripts/setup-mcp.js
// Tworzy MCP server w ElevenLabs i podpina do agenta
// Użycie: node scripts/setup-mcp.js

const https = require("https");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const eq = t.indexOf("=");
    if (eq === -1) return;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  });
  return env;
}

function api(method, hostname, apiPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { method, hostname, path: apiPath, family: 4, headers: { ...headers, ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}) } };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function el(method, apiPath, body) {
  return api(method, "api.elevenlabs.io", "/v1" + apiPath, body, {
    "xi-api-key": process.env.ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
  });
}

async function main() {
  const env = loadEnv();
  Object.assign(process.env, env);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const tunnelUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey) { console.error("Brak ELEVENLABS_API_KEY"); process.exit(1); }
  if (!agentId) { console.error("Brak ELEVENLABS_AGENT_ID"); process.exit(1); }
  if (!tunnelUrl) { console.error("Brak NEXT_PUBLIC_APP_URL"); process.exit(1); }

  const cleanUrl = tunnelUrl.replace(/\/+$/, "");
  const mcpUrl = `${cleanUrl}/api/mcp`;

  console.log(`Agent:  ${agentId}`);
  console.log(`Tunnel: ${cleanUrl}`);
  console.log(`MCP:    ${mcpUrl}\n`);

  // 1. Get current agent config
  console.log("1. Pobieram konfigurację agenta...");
  const agent = await el("GET", `/convai/agents/${agentId}`);
  if (agent.status !== 200) {
    console.error(`Blad: ${agent.status}`, agent.data);
    process.exit(1);
  }
  const prompt = agent.data?.conversation_config?.agent?.prompt || {};
  console.log(`   Istniejące MCP ID: ${prompt.native_mcp_server_ids?.join(", ") || "brak"}`);
  console.log(`   Tool IDs: ${prompt.tool_ids?.length || 0} narzędzi\n`);

  // 2. Delete old MCP servers
  const oldIds = prompt.native_mcp_server_ids || [];
  for (const oldId of oldIds) {
    console.log(`2. Usuwam stary MCP: ${oldId}...`);
    const del = await el("DELETE", `/convai/mcp-servers/${oldId}`);
    console.log(`   ${del.status === 200 || del.status === 204 ? "OK" : "Blad " + del.status}`);
  }

  // 3. List existing MCP servers in workspace to clean up orphans
  console.log("\n3. Czyszczę porzucone MCP serwery...");
  const listRes = await el("GET", "/convai/mcp-servers");
  if (listRes.status === 200 && listRes.data?.mcp_servers) {
    for (const srv of listRes.data.mcp_servers) {
      if (srv.config?.url === mcpUrl) {
        console.log(`   Już istnieje MCP z URL ${mcpUrl}: ${srv.id}`);
      } else if (!oldIds.includes(srv.id)) {
        console.log(`   Usuwam porzucony: ${srv.id} (${srv.config?.url || "?"})`);
        await el("DELETE", `/convai/mcp-servers/${srv.id}`);
      }
    }
  }

  // 4. Create new MCP server
  console.log("\n4. Tworzę nowy MCP server...");
  const create = await el("POST", "/convai/mcp-servers", {
    config: {
      url: mcpUrl,
      name: "witaline-tools",
      description: "WitaLine tools: business_lookup, save_lead, check_availability, create_reservation, get_services, get_business_hours, send_whatsapp, transfer_to_human, create_checkout",
      transport: "STREAMABLE_HTTP",
      approval_policy: "auto_approve_all",
      execution_mode: "immediate",
      response_timeout_secs: 30,
    },
  });

  if (create.status !== 200 && create.status !== 201) {
    console.error(`   Blad tworzenia MCP: ${create.status}`);
    console.error(JSON.stringify(create.data, null, 2));
    process.exit(1);
  }

  const mcpId = create.data?.id || create.data?.mcp_server_id;
  console.log(`   Utworzono: ${mcpId}`);

  // 5. Attach MCP to agent
  console.log("\n5. Podpinam MCP do agenta...");
  const attach = await el("PATCH", `/convai/agents/${agentId}`, {
    conversation_config: {
      agent: {
        prompt: {
          mcp_server_ids: [mcpId],
          native_mcp_server_ids: [mcpId],
        },
      },
    },
  });

  if (attach.status === 200) {
    console.log("   ✅ MCP podpięty do agenta!");
  } else {
    console.log(`   ⚠️  Blad: ${attach.status}`);
    console.log(JSON.stringify(attach.data, null, 2));
  }

  // 6. Verify
  console.log("\n6. Weryfikacja...");
  const verify = await el("GET", `/convai/agents/${agentId}`);
  const newPrompt = verify.data?.conversation_config?.agent?.prompt || {};
  const finalIds = newPrompt.native_mcp_server_ids || [];
  console.log(`   MCP server IDs: ${finalIds.join(", ") || "BRAK!"}`);
  console.log(`   Tool IDs: ${newPrompt.tool_ids?.length || 0}`);
  console.log(`   Prompt: ${(newPrompt.prompt || "").slice(0, 80)}...`);

  if (finalIds.includes(mcpId)) {
    console.log("\n   ✅ Sukces! MCP server podpięty i widoczny dla agenta.");
    console.log(`   Sprawdź w dashboardzie: https://elevenlabs.io/app/agents/${agentId}`);
  } else {
    console.log("\n   ⚠️  MCP nie został podpięty. Spróbuj ręcznie w dashboardzie.");
  }
}

main().catch((e) => { console.error("Blad:", e); process.exit(1); });
