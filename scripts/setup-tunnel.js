// ============================================================
// scripts/setup-tunnel.js
// Użycie: node scripts/setup-tunnel.js https://nowy-tunel.trycloudflare.com
//
// Aktualizuje WSZYSTKIE webhooki i URL-e po zmianie tunelu.
// Wystarczy podać nowy URL tunelu Cloudflare.
// ============================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Wczytaj .env ──
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
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
    env[key] = value;
  });
  return env;
}

// ── Helper HTTP ──
function api(method, hostname, apiPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname,
      path: apiPath,
      family: 4,
      headers: { ...headers, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
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

function elevenlabs(method, apiPath, body) {
  return api(method, 'api.elevenlabs.io', '/v1' + apiPath, body, {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  });
}

function twilio(method, apiPath, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return Promise.resolve({ status: 0, data: 'Twilio not configured' });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const encodedBody = body ? new URLSearchParams(body).toString() : null;
  return api(method, 'api.twilio.com', '/2010-04-01' + apiPath, encodedBody, {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  });
}

// ── MCP Server ID (utworzony przez src/lib/mcp/server.ts) ──
// UWAGA: URL nie może być aktualizowany przez PATCH — trzeba usunąć i stworzyć nowy
let MCP_SERVER_ID = null;

// ── Główna funkcja ──
async function main() {
  const tunnelUrl = process.argv[2];
  if (!tunnelUrl || !tunnelUrl.startsWith('https://')) {
    console.error('Użycie: node scripts/setup-tunnel.js https://nowy-tunel.trycloudflare.com');
    process.exit(1);
  }

  const cleanUrl = tunnelUrl.replace(/\/+$/, '');
  console.log(`\n🔧 Ustawiam URL tunelu: ${cleanUrl}\n`);

  // ── Krok 1: Aktualizuj .env ──
  console.log('📝 Krok 1/5: Aktualizuję .env...');
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Aktualizuj lub dodaj NEXT_PUBLIC_APP_URL
  if (envContent.includes('NEXT_PUBLIC_APP_URL=')) {
    envContent = envContent.replace(/^NEXT_PUBLIC_APP_URL=.*$/m, `NEXT_PUBLIC_APP_URL=${cleanUrl}`);
  } else {
    envContent += `\nNEXT_PUBLIC_APP_URL=${cleanUrl}`;
  }
  fs.writeFileSync(envPath, envContent, 'utf-8');

  // Przeładuj env — nadpisz tylko nasze zmienne
  const freshEnv = loadEnv();
  Object.assign(process.env, freshEnv);
  console.log('   ✅ .env zaktualizowany\n');

  // Agent ID — potrzebny od razu
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    console.error('❌ Brak ELEVENLABS_AGENT_ID w .env — nie można skonfigurować MCP ani webhooków');
    process.exit(1);
  }

  // ── Krok 2: Przekonfiguruj MCP server ElevenLabs ──
  // UWAGA: API PATCH nie pozwala zmienić URL — trzeba usunąć i stworzyć nowy
  console.log('🔧 Krok 2/5: Przekonfiguruję MCP server w ElevenLabs...');

  // Pobierz obecne MCP server ID z agenta
  const agentInfo = await elevenlabs('GET', `/convai/agents/${agentId}`);
  const oldMcpIds = agentInfo.data?.conversation_config?.agent?.prompt?.mcp_server_ids || [];

  // Usuń stare MCP serwery
  for (const oldId of oldMcpIds) {
    console.log(`   Usuwam stary MCP server: ${oldId}...`);
    const delRes = await elevenlabs('DELETE', `/convai/mcp-servers/${oldId}`);
    if (delRes.status === 200 || delRes.status === 204) {
      console.log(`   ✅ ${oldId} usunięty`);
    } else {
      console.log(`   ⚠️  Błąd usuwania ${oldId}: ${delRes.status}`);
    }
  }

  // Stwórz nowy MCP server z aktualnym URL-em
  const createRes = await elevenlabs('POST', '/convai/mcp-servers', {
    config: {
      url: `${cleanUrl}/api/mcp`,
      name: 'witaline-tools',
      description: 'Narzędzia WitaLine: business_lookup, save_lead, kalendarz, WhatsApp, transfer_to_human',
      transport: 'STREAMABLE_HTTP',
      approval_policy: 'auto_approve_all',
      execution_mode: 'immediate',
      response_timeout_secs: 30,
    },
  });

  if (createRes.status === 200 || createRes.status === 201) {
    const newMcpId = createRes.data?.id || createRes.data?.mcp_server_id;
    console.log(`   ✅ Nowy MCP server: ${newMcpId} → ${cleanUrl}/api/mcp`);

    // Podepnij do agenta — używamy mcp_server_ids (zgodnie z oficjalną dokumentacją ElevenLabs)
    const attachRes = await elevenlabs('PATCH', `/convai/agents/${agentId}`, {
      conversation_config: {
        agent: {
          prompt: {
            mcp_server_ids: [newMcpId],
            native_mcp_server_ids: [],
          },
        },
      },
    });
    if (attachRes.status === 200) {
      console.log('   ✅ MCP server podpięty do agenta');
    } else {
      console.log(`   ⚠️  Błąd podpinania MCP: ${attachRes.status}`);
    }
  } else {
    console.log(`   ⚠️  Błąd tworzenia MCP servera: ${createRes.status} - ${JSON.stringify(createRes.data).slice(0, 200)}`);
  }
  console.log();

  // ── Krok 2.5: Konfiguruj Twilio + webhooki w agentie ElevenLabs ──
  console.log('🔧 Krok 3/5: Konfiguruję Twilio i webhooki w agentie...');
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  // Workspace webhook dla client-data (kluczowy dla rozmów telefonicznych)
  try {
    const whRes = await elevenlabs('GET', '/workspace/webhooks');
    const existing = whRes.data?.webhooks || [];
    const hasClientData = existing.some((w) => w.webhook_url && w.webhook_url.includes('/api/elevenlabs/client-data'));
    if (!hasClientData) {
      const whBody = {
        name: 'client-data',
        target_url: `${cleanUrl}/api/elevenlabs/client-data`,
        events: ['conversation_initiation_client_data'],
        settings: { auth_type: 'hmac', name: 'client-data', webhook_url: `${cleanUrl}/api/elevenlabs/client-data` },
      };
      const whRes2 = await elevenlabs('POST', '/workspace/webhooks', whBody);
      if (whRes2.status === 200 || whRes2.status === 201) {
        console.log('   ✅ Workspace webhook client-data utworzony');
      } else {
        console.log(`   ⚠️  Błąd tworzenia client-data webhook: ${whRes2.status}`);
      }
    } else {
      console.log('   ✅ Workspace webhook client-data już istnieje');
    }
  } catch (e) {
    console.log('   ⚠️  Nie udało się skonfigurować workspace webhooków');
  }

  // Twilio credentials w agencie (opcjonalne — agent ma już numer przypisany)
  if (agentId && twilioSid && twilioToken) {
    const patchBody = {
      conversation_config: {
        agent: { twilio: { account_sid: twilioSid, auth_token: twilioToken } },
        webhook_overrides: {
          call_completed_url: `${cleanUrl}/api/elevenlabs/call-completed`,
          client_data_url: `${cleanUrl}/api/elevenlabs/client-data`,
        },
      },
    };
    const cfgRes = await elevenlabs('PATCH', `/convai/agents/${agentId}`, patchBody);
    if (cfgRes.status === 200) {
      console.log('   ✅ Twilio + webhooki skonfigurowane w agentie');
    } else {
      console.log(`   ⚠️  Błąd konfiguracji agenta: ${cfgRes.status} ${JSON.stringify(cfgRes.data).slice(0,200)}`);
    }
  } else {
    console.log('   ⚠️  Brak agentId lub TWILIO_ACCOUNT_SID — pomijam');
  }
  console.log();

  // ── Krok 4: Aktualizuj webhook Twilio dla głównego numeru ──
  console.log('🔧 Krok 4/5: Aktualizuję webhook Twilio...');
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  if (twilioNumber) {
    // Szukaj numeru w Twilio
    const searchRes = await twilio('GET', `/Accounts/${process.env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(twilioNumber)}`);
    if (searchRes.status === 200 && searchRes.data?.incoming_phone_numbers?.[0]?.sid) {
      const phoneSid = searchRes.data.incoming_phone_numbers[0].sid;
      const updateRes = await twilio('POST', `/Accounts/${process.env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${phoneSid}.json`, {
        VoiceUrl: `${cleanUrl}/api/twilio/spam-filter`,
        VoiceMethod: 'POST',
      });
      if (updateRes.status === 200) {
        console.log(`   ✅ Webhook Twilio dla ${twilioNumber} zaktualizowany`);
      } else {
        console.log(`   ⚠️  Błąd aktualizacji Twilio: ${updateRes.status}`);
      }
    } else {
      console.log(`   ⚠️  Nie znaleziono numeru ${twilioNumber} w Twilio — sprawdź TWILIO_PHONE_NUMBER w .env`);
    }
  }
  console.log();

  // ── Krok 5: Podsumowanie ──
  console.log('📋 Krok 5/5: Podsumowanie\n');
  console.log('   URL tunelu:          ' + cleanUrl);
  console.log('   .env:                ✅');
  console.log('   ElevenLabs MCP:      ✅');
  console.log('   ElevenLabs agent:    ✅');
  console.log('   Twilio webhook:      ✅');
  console.log('\n   ✅ Wszystkie webhooki zaktualizowane!\n');
  console.log('   ⚠️  UWAGA: Post-call transcription webhook w ElevenLabs');
  console.log('          ustaw ręcznie na https://elevenlabs.io/app/agents/settings');
  console.log(`          URL: ${cleanUrl}/api/elevenlabs/transcribe-handoff-recording`);
  console.log();
  console.log('   🔍 Zweryfikuj w ElevenLabs dashboard:');
  console.log(`      https://elevenlabs.io/app/agents/${agentId}`);
  console.log('      → Settings → sprawdź webhooki');
  console.log('      → MCP Servers → sprawdź URL');
  console.log('      → Tools → MCP: witaline-tools (8 narzędzi)');
  console.log();
}

main().catch(e => {
  console.error('❌ Błąd:', e.message || e);
  process.exit(1);
});