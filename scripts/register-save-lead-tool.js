const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env manually
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
const apiKey = envVars.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
const AGENT_ID = envVars.ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID;

if (!TUNNEL_URL) {
  console.error("ERROR: NEXT_PUBLIC_APP_URL is not set in .env");
  process.exit(1);
}
if (!apiKey) {
  console.error("ERROR: ELEVENLABS_API_KEY is not set");
  process.exit(1);
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'api.elevenlabs.io', path: '/v1' + path,
      headers: {
        'xi-api-key': apiKey,
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

async function main() {
  // 1. Register save_lead webhook tool
  console.log('Registering save_lead tool...');
  const toolPayload = {
    tool_config: {
      type: "webhook",
      name: "save_lead",
      description: "Zapisuje dane kontaktowe potencjalnego klienta (leada). Wywołaj to narzędzie, gdy klient poda swoje dane (imię, telefon, email, zainteresowanie).",
      response_timeout_secs: 10,
      api_schema: {
        request_headers: {},
        url: `${TUNNEL_URL}/api/elevenlabs/save-lead`,
        method: "POST",
        path_params_schema: {},
        query_params_schema: null,
        request_body_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Imię i nazwisko klienta" },
            phone: { type: "string", description: "Numer telefonu klienta" },
            email: { type: "string", description: "Email klienta (opcjonalnie)" },
            interest: { type: "string", description: "W czym klient jest zainteresowany" },
            notes: { type: "string", description: "Dodatkowe uwagi" },
            business_id: { type: "string", description: "ID firmy (jeśli znane)" }
          },
          required: ["name", "phone"]
        },
        response_body_schema: null,
        content_type: "application/json"
      }
    }
  };

  const toolRes = await request('POST', '/convai/tools', toolPayload);
  if (toolRes.status !== 200 && toolRes.status !== 201) {
    console.error('Failed to create tool:', toolRes.status, JSON.stringify(toolRes.data));
    process.exit(1);
  }

  const toolId = toolRes.data.tool_id || toolRes.data.id;
  console.log('Tool registered, ID:', toolId);

  // 2. Get current agent config
  console.log('Fetching agent config...');
  const agentRes = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (agentRes.status !== 200) {
    console.error('Failed to get agent:', agentRes.status);
    process.exit(1);
  }

  const agent = agentRes.data;
  const existingTools = agent.conversation_config?.agent?.prompt?.tool_ids || [];
  if (existingTools.includes(toolId)) {
    console.log('Tool already attached to agent.');
    return;
  }

  // 3. Attach tool to agent
  console.log('Attaching tool to agent...');
  const newToolIds = [...existingTools, toolId];
  const patchRes = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: newToolIds
        }
      }
    }
  });

  if (patchRes.status !== 200) {
    console.error('Failed to patch agent:', patchRes.status, JSON.stringify(patchRes.data).substring(0, 300));
    process.exit(1);
  }

  console.log('Tool attached successfully! Agent tool_ids:', patchRes.data.conversation_config?.agent?.prompt?.tool_ids);
}

main().catch(e => console.error('Unexpected error:', e));
