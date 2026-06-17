// scripts/update-tunnel.js
// Usage: node scripts/update-tunnel.js <tunnel-url>
// Updates .env, Twilio voice URL, MCP server, and config.

const https = require('https');
const fs = require('fs');
const path = require('path');

const NEW_URL = process.argv[2];
if (!NEW_URL || !NEW_URL.startsWith('https://')) {
  console.error('Usage: node scripts/update-tunnel.js https://tunnel-url.trycloudflare.com');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const CONFIG_PATH = path.join(ROOT, 'witaline-config.json');

// Load .env
const envRaw = fs.readFileSync(ENV_PATH, 'utf-8');
const env = {};
envRaw.split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
});

// Update .env
let updated = envRaw.replace(/^NEXT_PUBLIC_APP_URL=.*$/m, 'NEXT_PUBLIC_APP_URL=' + NEW_URL);
if (!updated.includes('NEXT_PUBLIC_APP_URL=')) updated += '\nNEXT_PUBLIC_APP_URL=' + NEW_URL;
fs.writeFileSync(ENV_PATH, updated, 'utf-8');
console.log('OK .env');

// Update config
try {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  cfg.tunnel_url = NEW_URL;
  cfg.updated_at = new Date().toISOString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  console.log('OK config');
} catch (_) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ tunnel_url: NEW_URL, agent_id: env.ELEVENLABS_AGENT_ID, updated_at: new Date().toISOString() }, null, 2), 'utf-8');
  console.log('OK config (new)');
}

const SID = env.TWILIO_ACCOUNT_SID;
const TOKEN = env.TWILIO_AUTH_TOKEN;
const API_KEY = env.ELEVENLABS_API_KEY;
const AGENT_ID = env.ELEVENLABS_AGENT_ID;

function api(method, host, path, body, headers) {
  return new Promise((resolve) => {
    const data = body ? (typeof body === 'string' ? body : new URLSearchParams(body).toString()) : null;
    const opts = { method, hostname: host, path, headers: Object.assign({}, headers || {}, data ? { 'Content-Length': Buffer.byteLength(data) } : {}) };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', e => resolve({ status: 0, data: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Twilio voice URL
  if (SID && TOKEN) {
    const auth = Buffer.from(SID + ':' + TOKEN).toString('base64');
    const h = { Authorization: 'Basic ' + auth };
    const search = await api('GET', 'api.twilio.com', '/2010-04-01/Accounts/' + SID + '/IncomingPhoneNumbers.json?PhoneNumber=' + encodeURIComponent('+48732125752'), null, h);
    if (search.status === 200 && search.data && search.data.incoming_phone_numbers && search.data.incoming_phone_numbers[0]) {
      const phoneSid = search.data.incoming_phone_numbers[0].sid;
      const upd = await api('POST', 'api.twilio.com', '/2010-04-01/Accounts/' + SID + '/IncomingPhoneNumbers/' + phoneSid + '.json',
        { VoiceUrl: NEW_URL + '/api/twilio/spam-filter', VoiceMethod: 'POST' },
        Object.assign({}, h, { 'Content-Type': 'application/x-www-form-urlencoded' }));
      console.log('Twilio:', upd.status, (upd.data && upd.data.voice_url) || '');
    } else {
      console.log('Twilio search failed:', search.status);
    }
  } else {
    console.log('Skipping Twilio: no credentials');
  }

  // ElevenLabs MCP server (create new one since URL can't be updated)
  if (API_KEY && AGENT_ID) {
    const elH = { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' };
    const el = (method, path, body) => api(method, 'api.elevenlabs.io', '/v1' + path, body, elH);

    // Get agent to find old MCP IDs
    const agent = await el('GET', '/convai/agents/' + AGENT_ID);
    if (agent.status === 200) {
      const prompt = agent.data.conversation_config && agent.data.conversation_config.agent && agent.data.conversation_config.agent.prompt || {};
      const oldMcpIds = prompt.mcp_server_ids || [];

      // Delete old MCP servers
      for (const oldId of oldMcpIds) {
        const del = await el('DELETE', '/convai/mcp-servers/' + oldId);
        console.log('Delete MCP', oldId.slice(0,12) + ':', del.status);
      }

      // Create new MCP server
      const create = await el('POST', '/convai/mcp-servers', {
        config: {
          url: NEW_URL + '/api/mcp',
          name: 'witaline-tools',
          description: 'Narzedzia WitaLine',
          transport: 'STREAMABLE_HTTP',
          approval_policy: 'auto_approve_all',
          execution_mode: 'immediate',
          response_timeout_secs: 30,
        },
      });
      if (create.status === 200 || create.status === 201) {
        const newMcpId = create.data && (create.data.id || create.data.mcp_server_id);
        console.log('Created MCP:', newMcpId);

        // Attach to agent
        const attach = await el('PATCH', '/convai/agents/' + AGENT_ID, {
          conversation_config: {
            agent: {
              prompt: {
                mcp_server_ids: [newMcpId],
                native_mcp_server_ids: [],
              },
            },
          },
        });
        console.log('Attach MCP:', attach.status);

        // Update config with new MCP ID
        try {
          const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
          cfg.mcp_server_id = newMcpId;
          cfg.updated_at = new Date().toISOString();
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
          console.log('OK config MCP ID updated');
        } catch (_) {}
      } else {
        console.log('Create MCP failed:', create.status, JSON.stringify(create.data).slice(0,200));
      }
    } else {
      console.log('Get agent failed:', agent.status);
    }

    // Update webhook_overrides (call_completed_url)
    const whUpdate = await el('PATCH', '/convai/agents/' + AGENT_ID, {
      conversation_config: {
        webhook_overrides: {
          call_completed_url: NEW_URL + '/api/elevenlabs/call-completed',
          client_data_url: NEW_URL + '/api/elevenlabs/client-data',
        },
      },
    });
    console.log('Webhook overrides:', whUpdate.status);
  }

  console.log('\nAll done. Tunnel:', NEW_URL);
}

main().catch(e => console.error('Fatal:', e));
