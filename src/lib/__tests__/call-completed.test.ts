import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-admin", () => {
  const data = { data: { id: "test-biz", current_plan: "pro", minutes_used_this_week: 10 }, error: null };
  const p = Promise.resolve(data);
  const q = Object.assign(p, {
    from: vi.fn(() => q),
    select: vi.fn(() => q),
    insert: vi.fn(() => q),
    update: vi.fn(() => q),
    eq: vi.fn(() => q),
    single: vi.fn(() => q),
    maybeSingle: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    catch: vi.fn((cb: (e: Error) => void) => p.catch(cb)),
  });
  return { supabaseAdmin: q, getSupabaseAdmin: vi.fn() };
});

vi.mock("@/lib/pricing", () => ({
  calculateCost: vi.fn(() => ({ cost: 1.49, minutes: 1 })),
  getPlanConfig: vi.fn(() => ({ prepaid_minutes: 0 })),
}));

vi.mock("@/lib/twilio-sms", () => ({ sendSms: vi.fn() }));
vi.mock("@/lib/twilio-whatsapp", () => ({ sendWhatsApp: vi.fn(), WHATSAPP_CONTINUITY_TEMPLATES: {} }));
vi.mock("@/lib/notifications", () => ({ addNotification: vi.fn() }));
vi.mock("@/lib/webhook-outbound", () => ({ sendWebhook: vi.fn() }));
vi.mock("@/lib/job-queue", () => ({ enqueueJob: vi.fn(() => Promise.resolve()) }));
vi.mock("@/lib/analyze-call", () => ({ analyzeCall: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimitMiddleware: vi.fn(() => ({ allowed: true })),
}));

function validBody(): Record<string, unknown> {
  return {
    agent_id: "test-agent",
    call_id: "call-123",
    conversation_id: "conv-123",
    call_duration: 60,
    business_id: "test-biz",
    call_status: "completed",
    summary: "Test call summary",
  };
}

describe("call-completed webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELEVENLABS_WEBHOOK_SECRET = "test_secret_123";
  });

  it("rejects request with wrong webhook secret", async () => {
    const { POST } = await import("@/app/api/elevenlabs/call-completed/route");
    const req = new Request("http://localhost/api/elevenlabs/call-completed", {
      method: "POST",
      headers: { "elevenlabs-webhook-secret": "wrong_secret" },
      body: JSON.stringify(validBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("signature");
  });

  // Pełne testy integracyjne wymagają mockowania łańcucha Supabase.
  // Testy wyżej (401 dla złego sekretu, 400 dla uszkodzonego JSON) pokrywają
  // najważniejszy fix bezpieczeństwa.
  it.todo("accepts request with correct webhook secret (integration)");
  it.todo("accepts request when secret is not configured (integration)");

  it("returns 400 for malformed JSON body", async () => {
    const { POST } = await import("@/app/api/elevenlabs/call-completed/route");
    const req = new Request("http://localhost/api/elevenlabs/call-completed", {
      method: "POST",
      headers: { "elevenlabs-webhook-secret": "test_secret_123" },
      body: "{invalid json}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
