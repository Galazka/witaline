/**
 * Uruchom PO zmianie tunelu Cloudflare:
 *   node scripts/update-tunnel-url.js <NOWY_URL>
 *
 * Przykład:
 *   node scripts/update-tunnel-url.js https://enabled-oregon-mere-donate.trycloudflare.com
 *
 * 1. Aktualizuje .env z nowym URL
 * 2. Odłącza stare tool-e od agenta (usuwa wszystkie tool_ids)
 * 3. Tworzy nowe tool-e z nowym URL
 * 4. Aktualizuje client-data webhook w agent
 * 5. Aktualizuje Twilio Voice URL
 * 6. Weryfikuje wszystko
 *
 * UWAGA: Post-call transcription webhook wymaga RĘCZNEJ konfiguracji:
 *   https://elevenlabs.io/app/agents/settings → Transcription webhooks → URL
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || '';
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'api.elevenlabs.io', path: '/v1' + path,
      headers: {
        'xi-api-key': API_KEY, 'Content-Type': 'application/json',
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

function requestCustom(method, fullUrl, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(fullUrl);
    const opts = {
      method, hostname: url.hostname, path: url.pathname + url.search,
      headers: { ...headers },
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function updateEnvFile(envPath, newUrl) {
  let content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  let found = false;
  const updated = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return line;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key === 'NEXT_PUBLIC_APP_URL') {
      found = true;
      return `NEXT_PUBLIC_APP_URL=${newUrl}`;
    }
    return line;
  });
  if (!found) {
    updated.push(`NEXT_PUBLIC_APP_URL=${newUrl}`);
  }
  fs.writeFileSync(envPath, updated.join('\n'), 'utf-8');
  console.log(`   ✅ .env updated: NEXT_PUBLIC_APP_URL=${newUrl}`);
}

async function main() {
  // --- Parse URL argument ---
  const args = process.argv.slice(2);
  let TUNNEL_URL = args[0] || '';

  if (!TUNNEL_URL) {
    // Fallback: read from .env
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      if (trimmed.slice(0, eqIdx).trim() === 'NEXT_PUBLIC_APP_URL') TUNNEL_URL = value;
    });
  }

  if (!TUNNEL_URL) {
    console.error('ERROR: Podaj URL tunelu jako argument lub ustaw NEXT_PUBLIC_APP_URL w .env');
    console.error('  node scripts/update-tunnel-url.js https://nowy-tunnel.trycloudflare.com');
    process.exit(1);
  }

  // Normalize: remove trailing slash
  TUNNEL_URL = TUNNEL_URL.replace(/\/+$/, '');
  console.log(`\n🔗 Tunnel URL: ${TUNNEL_URL}\n`);

  // --- Step 0: Update .env ---
  const envPath = path.join(__dirname, '..', '.env');
  console.log('0. Updating .env...');
  updateEnvFile(envPath, TUNNEL_URL);

  // --- Step 1: Fetch current agent config to see what tools exist ---
  console.log('\n1. Fetching current agent config...');
  const agentGet = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (agentGet.status !== 200) {
    console.error(`   ❌ Failed to get agent: ${agentGet.status}`);
    process.exit(1);
  }
  const agentConfig = agentGet.data;
  const currentToolIds = agentConfig.conversation_config?.agent?.prompt?.tool_ids || [];
  console.log(`   Current tool_ids (${currentToolIds.length}): ${currentToolIds.join(', ') || 'none'}`);

  // --- Step 2: Detach all tools from agent ---
  if (currentToolIds.length > 0) {
    console.log('\n2. Detaching all tools from agent...');
    const detach = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
      conversation_config: { agent: { prompt: { tool_ids: [] } } }
    });
    console.log(detach.status === 200 ? '   ✅ Tools detached' : `   ❌ ${detach.status}`);
  } else {
    console.log('\n2. No tools to detach.');
  }

  // --- Step 3: Delete old tools ---
  if (currentToolIds.length > 0) {
    console.log('\n3. Deleting old tools...');
    for (const id of currentToolIds) {
      const del = await request('DELETE', `/convai/tools/${id}`);
      const ok = del.status === 200 || del.status === 204 || del.status === 404;
      console.log(ok ? `   ✅ ${id} deleted` : `   ⚠️  ${id} (${del.status})`);
    }
  } else {
    console.log('\n3. No old tools to delete.');
  }

  // --- Step 4: Update client-data webhook ---
  console.log('\n4. Updating client-data webhook URL...');
  const r1 = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    workspace_overrides: {
      conversation_initiation_client_data_webhook: {
        url: `${TUNNEL_URL}/api/elevenlabs/client-data`,
        request_headers: { 'Content-Type': 'application/json' }
      }
    }
  });
  console.log(r1.status === 200 ? '   ✅ Client-data webhook updated' : `   ❌ ${r1.status}`);

  // --- Step 5: Update Twilio webhook ---
  console.log('\n5. Updating Twilio voice URL...');
  try {
    const twilioAuth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const decodedPhone = decodeURIComponent(TWILIO_PHONE);
    const tRes = await requestCustom('GET', `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json?PhoneNumber=${decodedPhone}`,
      { 'Authorization': `Basic ${twilioAuth}` });
    const numbers = tRes.data;
    const phoneSid = typeof numbers === 'string'
      ? numbers.match(/<Sid>([^<]+)<\/Sid>/)?.[1]
      : numbers.incoming_phone_numbers?.[0]?.sid;
    if (!phoneSid) throw new Error('Nie znaleziono SID numeru w Twilio');
    const updateBody = `VoiceUrl=${encodeURIComponent(`${TUNNEL_URL}/api/twilio/spam-filter`)}`;
    const tRes2 = await requestCustom('POST', `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers/${phoneSid}.json`,
      { 'Authorization': `Basic ${twilioAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, updateBody);
    console.log(tRes2.status === 200 ? '   ✅ Twilio URL updated' : `   ❌ ${tRes2.status}`);
  } catch (e) {
    console.log(`   ⚠️  Twilio update failed: ${e.message || e}`);
    console.log('   (You can update Twilio voice URL manually in Twilio Console)');
  }

  // --- Step 6: Create new tools ---
  console.log('\n6. Creating new tools...');
  const scriptsDir = __dirname;
  const registrationScripts = [
    'register-business-lookup-tool.js',
    'register-save-lead-tool.js',
    'register-calendar-tools.js',
    'register-whatsapp-tool.js'
  ];
  for (const script of registrationScripts) {
    const scriptPath = path.join(scriptsDir, script);
    if (!fs.existsSync(scriptPath)) {
      console.log(`   ⚠️  ${script} not found, skipping`);
      continue;
    }
    console.log(`   Running ${script}...`);
    try {
      const out = execSync(`node "${scriptPath}"`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        timeout: 45000,
      });
      const lines = out.trim().split('\n').filter(l => l.trim());
      const summary = lines.filter(l => l.startsWith('Tool registered') || l.startsWith('Done!') || l.startsWith('Agent updated') || l.includes('ID:'));
      console.log(`      ${summary.join(' | ') || lines.pop() || 'OK'}`);
    } catch (e) {
      console.error(`      ❌ ${e.message.substring(0, 200)}`);
    }
  }

  // --- Step 7: Final verification ---
  console.log('\n7. Final verification...');
  const v = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (v.status === 200) {
    const cfg = v.data;
    const w = cfg.workspace_overrides?.conversation_initiation_client_data_webhook;
    console.log(`   client-data webhook: ${w?.url || '❌ NOT SET'}`);
    console.log(`   post_call_webhook_id: ${cfg.workspace_overrides?.webhooks?.post_call_webhook_id || '⚠️  NOT SET (set manually)'}`);
    const ids = cfg.conversation_config?.agent?.prompt?.tool_ids || [];
    console.log(`   Agent tools (${ids.length}): ${ids.join(', ') || '❌ NONE'}`);
  } else {
    console.log(`   ❌ Failed to verify agent: ${v.status}`);
  }

  console.log('\n✅ Done.');
  console.log('\n⚠️  RĘCZNIE ustaw post-call transcription webhook w ElevenLabs dashboard:');
  console.log(`   ${TUNNEL_URL}/api/elevenlabs/call-completed`);
  console.log('   https://elevenlabs.io/app/agents/settings → Transcription webhooks → URL\n');
}

main().catch(e => console.error('Error:', e));
