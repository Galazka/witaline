import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { TOOL_DEFINITIONS } from "./tools";
import { handleToolCall } from "./handlers";

let serverInstance: McpServer | null = null;
let transport: WebStandardStreamableHTTPServerTransport | null = null;

function createServer(): McpServer {
  const server = new McpServer(
    { name: "witaline-mcp", version: "1.0.0" },
    { capabilities: {} }
  );

  for (const def of TOOL_DEFINITIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: any = def.inputSchema;
    server.registerTool(def.name, {
      description: def.description,
      inputSchema: schema,
    }, async (args: Record<string, unknown>) => {
      return handleToolCall(def.name, args);
    });
  }

  return server;
}

export async function getOrCreateTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
  if (!serverInstance) {
    serverInstance = createServer();
  }
  if (!transport) {
    // Stateless mode - no session management, works with GET before initialize
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: false,
    });
    await serverInstance.connect(transport);
  }
  return transport;
}

export async function resetTransport(): Promise<void> {
  if (transport) {
    try { await transport.close(); } catch { /* ignore */ }
    transport = null;
  }
  if (serverInstance) {
    try { await serverInstance.close(); } catch { /* ignore */ }
    serverInstance = null;
  }
}
