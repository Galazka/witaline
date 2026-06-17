const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = "agent_1501krvm9y90e549tyg96mgczsfv";

async function backup() {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  if (!res.ok) {
    console.error("Failed to fetch agent:", res.status, res.statusText);
    process.exit(1);
  }

  const agent = await res.json();
  const prompt = agent.conversation_config?.agent?.prompt?.prompt;

  if (!prompt) {
    console.error("No prompt found in agent config");
    process.exit(1);
  }

  const fs = require("fs");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const header = `=== WitaLine Agent Prompt Backup ===\nTimestamp: ${timestamp}\nAgent ID: ${AGENT_ID}\n\n`;
  fs.writeFileSync("scripts/prompt-backup.txt", header + prompt, "utf-8");
  console.log("Prompt saved to scripts/prompt-backup.txt");
}

backup();
