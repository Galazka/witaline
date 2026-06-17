const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[key] = value;
});

const TUNNEL_URL = envVars.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = 'agent_1501krvm9y90e549tyg96mgczsfv';

if (!TUNNEL_URL) {
  console.error("ERROR: NEXT_PUBLIC_APP_URL is not set in .env");
  process.exit(1);
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'api.elevenlabs.io', path: '/v1' + path,
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function makeToolPayload(name, description, url, params) {
  const properties = {};
  const required = [];
  for (const [key, info] of Object.entries(params)) {
    properties[key] = { type: info.type, description: info.description };
    if (info.required) required.push(key);
  }
  return {
    tool_config: {
      type: "webhook",
      name,
      description,
      response_timeout_secs: 10,
      api_schema: {
        request_headers: {},
        url,
        method: "POST",
        path_params_schema: {},
        query_params_schema: null,
        request_body_schema: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {})
        },
        response_body_schema: null,
        content_type: "application/json"
      }
    }
  };
}

async function createTool(name, description, url, params) {
  console.log(`Creating tool: ${name}...`);
  const payload = makeToolPayload(name, description, url, params);
  const res = await request('POST', '/convai/tools', payload);
  if (res.status !== 200 && res.status !== 201) {
    console.error(`Failed to create tool ${name}:`, res.status, JSON.stringify(res.data));
    process.exit(1);
  }
  const toolId = res.data.tool_id || res.data.id;
  console.log(`  ${name} -> ID: ${toolId}`);
  return toolId;
}

async function main() {
  const tools = [
    {
      name: "check_availability",
      description: "Sprawdza dostępne terminy dla podanej daty. Jeśli brak, zwraca najbliższe wolne dni. business_id jest przekazywane automatycznie.",
      url: `${TUNNEL_URL}/api/elevenlabs/check-availability`,
      params: {
        date: { type: "string", description: "Data w formacie YYYY-MM-DD", required: true },
        service_type: { type: "string", description: "Rodzaj usługi (opcjonalnie)", required: false }
      }
    },
    {
      name: "create_reservation",
      description: "Tworzy nową rezerwację wizyty. Zabezpieczone przed double-booking. business_id jest przekazywane automatycznie.",
      url: `${TUNNEL_URL}/api/elevenlabs/create-reservation`,
      params: {
        reserved_at: { type: "string", description: "Data i godzina rezerwacji w formacie ISO 8601", required: true },
        service_type: { type: "string", description: "Rodzaj usługi", required: true },
        caller_name: { type: "string", description: "Imię i nazwisko klienta", required: true },
        caller_phone: { type: "string", description: "Numer telefonu klienta (opcjonalnie)", required: false },
        notes: { type: "string", description: "Dodatkowe uwagi", required: false }
      }
    },
    {
      name: "get_services",
      description: "Pobiera listę usług oferowanych przez firmę z cenami i czasem trwania. business_id jest przekazywane automatycznie.",
      url: `${TUNNEL_URL}/api/elevenlabs/get-services`,
      params: {}
    },
    {
      name: "get_business_hours",
      description: "Sprawdza godziny otwarcia firmy w poszczególne dni tygodnia. business_id jest przekazywane automatycznie.",
      url: `${TUNNEL_URL}/api/elevenlabs/get-business-hours`,
      params: {}
    }
  ];

  const newToolIds = [];
  for (const t of tools) {
    const id = await createTool(t.name, t.description, t.url, t.params);
    newToolIds.push(id);
  }

  console.log('\nFetching agent config...');
  const agentRes = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (agentRes.status !== 200) {
    console.error('Failed to get agent:', agentRes.status);
    process.exit(1);
  }

  const agent = agentRes.data;
  const existingTools = agent.conversation_config?.agent?.prompt?.tool_ids || [];
  console.log('Existing tool_ids:', existingTools);

  const allToolIds = [...new Set([...existingTools, ...newToolIds])];
  if (allToolIds.length === existingTools.length && existingTools.every(id => newToolIds.includes(id))) {
    console.log('All calendar tools already attached to agent.');
    console.log('New tool_ids:', newToolIds);
    return;
  }

  console.log('Patching agent with tool_ids:', allToolIds);
  const patchRes = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: allToolIds
        }
      }
    }
  });

  if (patchRes.status !== 200) {
    console.error('Failed to patch agent:', patchRes.status, JSON.stringify(patchRes.data).substring(0, 300));
    process.exit(1);
  }

  console.log('\nAgent updated successfully!');
  console.log('New tool_ids added:', newToolIds);
  console.log('All agent tool_ids:', patchRes.data.conversation_config?.agent?.prompt?.tool_ids);
}

main().catch(e => console.error('Unexpected error:', e));
