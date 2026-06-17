const https = require('https');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = 'agent_1501krvm9y90e549tyg96mgczsfv';
const WEBHOOK_ID = 'fbc67491d72643ffb82910b68befac4b';

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
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`Assigning webhook ${WEBHOOK_ID} to agent...`);
  const res = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    workspace_overrides: {
      webhooks: {
        post_call_webhook_id: WEBHOOK_ID
      }
    }
  });
  if (res.status === 200) {
    console.log('✅ Webhook assigned');
  } else {
    console.log('❌ Failed:', res.status, JSON.stringify(res.data).substring(0, 300));
  }
}

main().catch(e => console.error('Error:', e));
