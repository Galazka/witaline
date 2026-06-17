import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

import { authenticateApiKey } from "../api-auth";

function mockReq(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new Request("http://localhost", { headers });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("authenticateApiKey", () => {
  it("returns 401 when no Authorization header", async () => {
    const result = await authenticateApiKey(mockReq());
    expect(result.businessId).toBeNull();
    expect(result.error).toBeInstanceOf(Response);
    expect(result.error!.status).toBe(401);
  });

  it("returns 401 when not Bearer", async () => {
    const result = await authenticateApiKey(mockReq("Basic xxx"));
    expect(result.businessId).toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it("returns 401 when empty key", async () => {
    const result = await authenticateApiKey(mockReq("Bearer "));
    expect(result.businessId).toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it("returns 401 when key not found in DB", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    });

    const result = await authenticateApiKey(mockReq("Bearer invalid-key-123"));
    expect(result.businessId).toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it("returns businessId on valid key", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "biz-123" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    });

    const result = await authenticateApiKey(mockReq("Bearer valid-key-123"));
    expect(result.businessId).toBe("biz-123");
    expect(result.error).toBeNull();
  });

  it("trims whitespace from Bearer token", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "biz-123" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    });

    const result = await authenticateApiKey(mockReq("Bearer   valid-key-123  "));
    expect(result.businessId).toBe("biz-123");
  });
});
