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
const API_KEY = envVars.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
const AGENT_ID = envVars.ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID;

if (!TUNNEL_URL) { console.error('ERROR: NEXT_PUBLIC_APP_URL not set'); process.exit(1); }
if (!API_KEY) { console.error('ERROR: ELEVENLABS_API_KEY not set'); process.exit(1); }
if (!AGENT_ID) { console.error('ERROR: ELEVENLABS_AGENT_ID not set'); process.exit(1); }

function request(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'api.elevenlabs.io',
      path: '/v1' + apiPath,
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

async function main() {
  const toolPayload = {
    tool_config: {
      type: 'webhook',
      name: 'transfer_to_human',
      description: 'Przekazuje połączenie do człowieka/konsultanta firmy, gdy klient wyraźnie poprosi o rozmowę z osobą. Użyj tylko wtedy, gdy klient powiedział np. "poproszę człowieka", "konsultant", "nie bot", "połącz z właścicielem". Nie używaj do zwykłych pytań.',
      response_timeout_secs: 10,
      api_schema: {
        request_headers: {},
        url: `${TUNNEL_URL}/api/elevenlabs/transfer-human`,
        method: 'POST',
        path_params_schema: {},
        query_params_schema: null,
        request_body_schema: {
          type: 'object',
          properties: {
            business_id: { type: 'string', description: 'ID firmy z dynamic_vars.business_id' },
            caller_phone: { type: 'string', description: 'Numer telefonu klienta z kierunkowym, np. +48732125752' },
            to_number: { type: 'string', description: 'Numer WitaLine/Twilio, na który klient dzwonił' },
            reason: { type: 'string', description: 'Powód przekazania, np. voice_request lub dtmf_0' },
          },
          required: ['business_id', 'caller_phone', 'to_number'],
        },
        response_body_schema: null,
        content_type: 'application/json',
      },
    },
  };

  const toolRes = await request('POST', '/convai/tools', toolPayload);
  if (toolRes.status !== 200 && toolRes.status !== 201) {
    console.error('Failed to create/update transfer_to_human:', toolRes.status, JSON.stringify(toolRes.data));
    process.exit(1);
  }
  const toolId = toolRes.data.tool_id || toolRes.data.id;
  console.log('transfer_to_human ->', toolId);

  const agentRes = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (agentRes.status !== 200) {
    console.error('Failed to get agent:', agentRes.status, JSON.stringify(agentRes.data));
    process.exit(1);
  }

  const agent = agentRes.data;
  const existingTools = agent.conversation_config?.agent?.prompt?.tool_ids || [];
  const newToolIds = [...new Set([...existingTools, toolId])];
  if (existingTools.includes(toolId)) {
    console.log('transfer_to_human already attached to agent.');
    return;
  }

  const patchRes = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: newToolIds,
        },
      },
    },
  });

  if (patchRes.status !== 200) {
    console.error('Failed to patch agent:', patchRes.status, JSON.stringify(patchRes.data).substring(0, 300));
    process.exit(1);
  }

  console.log('transfer_to_human attached. Agent tool_ids:', patchRes.data.conversation_config?.agent?.prompt?.tool_ids);
}

main().catch(e => console.error('Unexpected error:', e));
