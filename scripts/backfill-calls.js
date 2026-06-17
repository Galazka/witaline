// scripts/backfill-calls.js
// Backfilluje rozmowy z ElevenLabs do call_logs.
// Uruchom: node scripts/backfill-calls.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1/convai';
const WITALINE_MAIN_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_COST_PER_TOKEN = 0.00038;

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const eq = t.indexOf('=');
    if (eq === -1) return;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

function api(method, hostname, path, body, headers = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { method, hostname, path, headers: { ...headers, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, data: d }); } });
    });
    req.on('error', e => resolve({ status: 0, data: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const env = loadEnv();
  const API_KEY = env.ELEVENLABS_API_KEY;
  const AGENT_ID = env.ELEVENLABS_AGENT_ID;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!API_KEY || !AGENT_ID || !SUPABASE_KEY || !SUPABASE_URL) {
    console.error('Brakuje zmiennych w .env');
    process.exit(1);
  }

  const supabaseHost = SUPABASE_URL.replace('https://', '');

  // Poprzednio zapisane conversation_id (z obiektu metadata_raw lub osobnego indeksu)
  // — nie mamy kolumny conversation_id w call_logs, więc dedup po ID z listy ElevenLabs
  const existingSet = new Set();

  // Pobierz rozmowy z ElevenLabs
  let cursor;
  let page = 0;
  let saved = 0;
  let skipped = 0;

  while (page < 20) {
    page++;
    const params = new URLSearchParams({ agent_id: AGENT_ID, page_size: '100' });
    if (cursor) params.set('cursor', cursor);

    const convRes = await api('GET', 'api.elevenlabs.io', '/v1/convai/conversations?' + params, null, {
      'xi-api-key': API_KEY,
    });
    if (convRes.status !== 200) {
      console.error('Błąd ElevenLabs:', convRes.status, JSON.stringify(convRes.data).slice(0, 200));
      break;
    }

    const conversations = convRes.data.conversations || [];
    if (conversations.length === 0) break;
    console.log(`Strona ${page}: ${conversations.length} rozmów`);

    for (const conv of conversations) {
      const convId = conv.conversation_id;
      if (!convId) continue;

      // Dedup po conversation_id (unikamy fałszywych duplikatów gdy caller_id/duration są puste)
      if (existingSet.has(convId)) { skipped++; continue; }

      // Pobierz szczegóły — dopiero tutaj mamy prawdziwe dane
      const detRes = await api('GET', 'api.elevenlabs.io', '/v1/convai/conversations/' + convId, null, {
        'xi-api-key': API_KEY,
      });
      if (detRes.status !== 200) continue;

      const detail = detRes.data;
      const analysis = detail.analysis || {};
      const metadata = detail.metadata || {};
      const transcript = detail.transcript || [];
      const transcriptText = Array.isArray(transcript)
        ? transcript.map(t => `[${t.role}] ${t.message}`).join('\n')
        : '';
      const summary = analysis.transcript_summary || '';

      const phoneData = metadata.phone_call || {};
      const callNumber = phoneData.external_number || phoneData.from_number || '';
      const agentNumber = phoneData.agent_number || '';
      const durationSec = metadata.call_duration_secs || 0;

      // Określ business_id
      const dynVars = (detail.conversation_initiation_client_data?.dynamic_variables) || {};
      let businessId = dynVars.businessId || '';
      if (!businessId && agentNumber) {
        const bizRes = await api('GET', supabaseHost, `/rest/v1/businesses?select=id&twilio_number=eq.${encodeURIComponent(agentNumber)}&limit=1`, null, {
          apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
        });
        if (Array.isArray(bizRes.data) && bizRes.data.length > 0) businessId = bizRes.data[0].id;
      }
      if (!businessId) businessId = WITALINE_MAIN_BUSINESS_ID;
      const isMainLine = businessId === WITALINE_MAIN_BUSINESS_ID;

      // Koszt
      let costPln;
      if (isMainLine) {
        const tokens = Math.ceil((durationSec / 60) * 1000);
        costPln = Math.round(tokens * ADMIN_COST_PER_TOKEN * 100) / 100;
      } else {
        const bizRes = await api('GET', supabaseHost, `/rest/v1/businesses?select=current_plan&id=eq.${businessId}&limit=1`, null, {
          apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
        });
        const plan = Array.isArray(bizRes.data) && bizRes.data.length > 0 ? bizRes.data[0].current_plan : 'start_100';
        costPln = 0.5; // przybliżenie dla klientów
      }

      // Wstaw call_log
      const insertData = {
        business_id: businessId,
        duration_seconds: durationSec,
        cost_pln: costPln || 0,
        caller_id: callNumber || 'unknown',
        from_number: callNumber || '',
        transcript: transcriptText || '',
        classification: 'unknown',
        ai_summary: summary || '',
        ended_at: new Date().toISOString(),
        tokens_input: Math.ceil((durationSec / 60) * 400),
        tokens_output: Math.ceil((durationSec / 60) * 600),
        tokens_total: Math.ceil((durationSec / 60) * 1000),
      };

      const insRes = await api('POST', supabaseHost, '/rest/v1/call_logs', insertData, {
        'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation',
      });
      if (insRes.status === 201) {
        saved++;
        existingSet.add(convId);
        console.log(`  ✅ ${convId.slice(0, 20)}: ${callNumber || '?'} ${durationSec}s ${costPln} PLN`);
      } else {
        console.log(`  ❌ ${convId.slice(0, 20)}: ${insRes.status} ${JSON.stringify(insRes.data).slice(0, 100)}`);
      }
    }

    cursor = convRes.data.next_cursor;
    if (!cursor || !convRes.data.has_more) break;
  }

  console.log(`\nPodsumowanie: ${saved} zapisano, ${skipped} pominięto (duplikaty), ${page} stron`);
}

main().catch(e => console.error('Błąd:', e));
