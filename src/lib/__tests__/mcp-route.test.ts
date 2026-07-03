import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  rateLimitMiddleware: vi.fn(() => ({ allowed: true, headers: {} })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
          in: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/transfer-store", () => ({ setPendingTransfer: vi.fn() }));
vi.mock("@/lib/cache", () => ({ withCache: vi.fn() }));
vi.mock("@/lib/calendar", () => ({ createBooking: vi.fn(), checkAvailability: vi.fn() }));
vi.mock("@/lib/twilio-utils", () => ({ escapeXml: vi.fn(), redirectActiveCallToHumanHandoff: vi.fn() }));
vi.mock("@/lib/active-call-store", () => ({ getActiveCallSids: vi.fn() }));

function mcpReq(body: unknown, ip?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (ip) headers.set("x-forwarded-for", ip);
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("MCP route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 200 OK", async () => {
    const { GET } = await import("@/app/api/mcp/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("returns parse error for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json at all",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
  });

  it("returns Method not found for unknown method", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const res = await POST(mcpReq({ jsonrpc: "2.0", id: 1, method: "bogus" }) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32601);
    expect(body.error.message).toContain("Method not found");
  });

  it("tools/list returns all 8 tools", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const res = await POST(mcpReq({ jsonrpc: "2.0", id: 2, method: "tools/list" }) as any);
    const body = await res.json();
    expect(body.id).toBe(2);
    expect(body.result.tools).toHaveLength(8);
    const names = body.result.tools.map((t: any) => t.name);
    expect(names).toContain("business_lookup");
    expect(names).toContain("save_lead");
    expect(names).toContain("transfer_to_human");
    expect(names).toContain("create_checkout");
    expect(names).toContain("check_availability");
    expect(names).toContain("create_reservation");
    expect(names).toContain("get_services");
    expect(names).toContain("get_business_hours");
  });

  it("initialize returns server capabilities", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const res = await POST(mcpReq({ jsonrpc: "2.0", id: 1, method: "initialize" }) as any);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe("witaline-mcp");
    expect(body.result.protocolVersion).toBe("2024-11-05");
  });

  it("tools/call unknown tool returns error result", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const res = await POST(mcpReq({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nonexistent", arguments: {} } }) as any);
    const body = await res.json();
    expect(body.result.content[0].text).toContain("Unknown tool");
  });

  it("tools/call with witaline-tools_ prefix strips prefix", async () => {
    const { POST } = await import("@/app/api/mcp/route");
    const res = await POST(mcpReq({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "witaline-tools_nonexistent", arguments: {} } }) as any);
    const body = await res.json();
    expect(body.result.content[0].text).toContain("Unknown tool");
  });
});
