const https = require('https');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = 'agent_1501krvm9y90e549tyg96mgczsfv';
const POST_CALL_WEBHOOK_ID = 'bb3097b1d125495e899c4c7a64b85d69';

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

async function main() {
  // 1. Try to enable enable_conversation_initiation_client_data_from_webhook
  console.log('=== Trying: enable_conversation_initiation_client_data_from_webhook ===');
  const res1 = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    overrides: {
      enable_conversation_initiation_client_data_from_webhook: true
    }
  });
  if (res1.status !== 200) {
    console.log('FAILED:', res1.status, JSON.stringify(res1.data).substring(0, 200));
  } else {
    const current = res1.data.overrides?.enable_conversation_initiation_client_data_from_webhook;
    console.log('Response value:', current);
    if (current === true) {
      console.log('SUCCESS: Flag is now enabled!');
    } else {
      console.log('NOT CHANGED (likely read-only field):', current);
    }
  }

  // 2. Try to restore post_call_webhook_id
  console.log('\n=== Trying: post_call_webhook_id ===');
  const res2 = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    workspace_overrides: {
      webhooks: {
        post_call_webhook_id: POST_CALL_WEBHOOK_ID
      }
    }
  });
  if (res2.status !== 200) {
    console.log('FAILED:', res2.status, JSON.stringify(res2.data).substring(0, 200));
  } else {
    const current = res2.data.workspace_overrides?.webhooks?.post_call_webhook_id;
    console.log('Response value:', current);
    if (current === POST_CALL_WEBHOOK_ID) {
      console.log('SUCCESS: post_call_webhook_id restored!');
    } else {
      console.log('NOT CHANGED:', current);
    }
  }

  // 3. Verify final state
  console.log('\n=== Final verification ===');
  const verify = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (verify.status === 200) {
    const o = verify.data;
    console.log('enable_conversation_initiation_client_data_from_webhook:',
      o.overrides?.enable_conversation_initiation_client_data_from_webhook);
    console.log('post_call_webhook_id:',
      o.workspace_overrides?.webhooks?.post_call_webhook_id);
  }
}

main().catch(e => console.error('Error:', e));
