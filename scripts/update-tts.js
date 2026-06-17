const https = require('https');
const body = JSON.stringify({
  conversation_config: {
    agent: {
      prompt: {
        mcp_server_ids: [],
        native_mcp_server_ids: ['ltzKacUizfEUYUYdalZF']
      }
    }
  }
});
const req = https.request({
  hostname: 'api.elevenlabs.io',
  path: '/v1/convai/agents/agent_1501krvm9y90e549tyg96mgczsfv',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const data = JSON.parse(d);
    console.log(JSON.stringify(data, null, 2).slice(0, 500));
  });
});
req.write(body);
req.end();
