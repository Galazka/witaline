const fetch = require('node-fetch');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const MCP_SERVER_ID = 'j96vJ4SWWux45ujAIAuP'; // ID from config

if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  process.exit(1);
}

(async () => {
  const url = `https://api.elevenlabs.io/v1/agents/${ELEVENLABS_AGENT_ID}`;
  const body = {
    conversation_config: {
      built_in_tools: {
        mcp_server_ids: [MCP_SERVER_ID]
      }
    }
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
})();
