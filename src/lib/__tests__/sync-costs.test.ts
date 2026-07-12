import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-admin", () => {
  const chainable = (result: any) => {
    const q = Promise.resolve(result);
    return Object.assign(q, {
      select: vi.fn(() => q),
      from: vi.fn(() => q),
      insert: vi.fn(() => q),
      update: vi.fn(() => q),
      delete: vi.fn(() => q),
      eq: vi.fn(() => q),
      is: vi.fn(() => q),
      not: vi.fn(() => q),
      gt: vi.fn(() => q),
      gte: vi.fn(() => q),
      lte: vi.fn(() => q),
      lt: vi.fn(() => q),
      or: vi.fn(() => q),
      order: vi.fn(() => q),
      limit: vi.fn(() => q),
      single: vi.fn(() => q),
      maybeSingle: vi.fn(() => q),
      catch: vi.fn(),
    });
  };
  return { supabaseAdmin: chainable({ data: [], error: null }), getSupabaseAdmin: vi.fn() };
});

vi.mock("@/lib/admin-auth", () => ({
  checkAdminAuth: vi.fn(() => Promise.resolve({ error: null })),
}));

describe("sync-costs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { checkAdminAuth } = await import("@/lib/admin-auth");
    (checkAdminAuth as any).mockResolvedValueOnce({
      error: new Response("Unauthorized", { status: 401 }),
    });
    const { POST } = await import("@/app/api/admin/sync-costs/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns stats summary on success", async () => {
    const { checkAdminAuth } = await import("@/lib/admin-auth");
    (checkAdminAuth as any).mockResolvedValueOnce({ error: null });
    const { POST } = await import("@/app/api/admin/sync-costs/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("stats");
    expect(body.stats).toHaveProperty("total");
  });
});
