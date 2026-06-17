const https = require('https');
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = 'agent_1501krvm9y90e549tyg96mgczsfv';

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
  // Get current agent config
  console.log('Fetching agent config...');
  const agentRes = await request('GET', `/convai/agents/${AGENT_ID}`);
  if (agentRes.status !== 200) {
    console.error('Failed to get agent:', agentRes.status);
    process.exit(1);
  }

  const current = agentRes.data.conversation_config?.agent?.prompt?.prompt || '';
  console.log('Current prompt length:', current.length, 'chars');

  // Check if save_lead is already mentioned
  if (current.includes('save_lead')) {
    console.log('save_lead already in prompt, skipping.');
    return;
  }

  // Add save_lead instructions before the last section
  const leadSection = `
=== ZBIERANIE DANYCH KONTAKTOWYCH ===
Masz dostep do narzedzia save_lead, ktore zapisuje dane kontaktowe potencjalnego klienta.

Gdy dzwoniacy jest zainteresowany oferta WitaLine lub inna usluga:
1. Zapytaj o imie, numer telefonu, email (opcjonalnie) i w czym jest zainteresowany
2. Uzyj narzedzia save_lead z tymi danymi
3. Powiedz ze ktos sie skontaktuje lub ze informacja zostala zapisana

save_lead wymaga: imie i numer telefonu (obowiazkowe), email i zainteresowanie (opcjonalne).
`;

  const updated = current + leadSection;
  console.log('Updating prompt...');

  // PATCH the agent prompt
  const res = await request('PATCH', `/convai/agents/${AGENT_ID}`, {
    conversation_config: {
      agent: {
        prompt: {
          prompt: updated
        }
      }
    }
  });

  if (res.status !== 200) {
    console.error('Failed to update prompt:', res.status, JSON.stringify(res.data).substring(0, 300));
    process.exit(1);
  }

  console.log('Prompt updated successfully!');
  console.log('New length:', updated.length, 'chars');
}

main().catch(e => console.error('Error:', e));
