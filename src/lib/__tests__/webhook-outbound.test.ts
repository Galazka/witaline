import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabaseAdmin
vi.mock("../supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
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

import { sendWebhook } from "../webhook-outbound";

const validPayload = {
  event: "call.completed" as const,
  call_id: "test-call-123",
  caller_id: "48732125752",
  from_number: "+48732125752",
  duration_seconds: 120,
  classification: "zapytanie_ofertowe",
  ai_summary: "Klient pytał o cennik",
  transcript: "test transcript",
  recording_url: "https://example.com/rec.mp3",
  was_helpful: true,
  started_at: new Date().toISOString(),
  ended_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendWebhook", () => {
  it("returns success: false when no webhook_url", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const singleFn = vi.fn().mockResolvedValue({ data: { webhook_url: null, webhook_secret: "" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: singleFn })),
      })),
    });

    const result = await sendWebhook("biz-1", validPayload);
    expect(result.success).toBe(false);
  });

  it("includes correct headers", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const singleFn = vi.fn().mockResolvedValue({ data: { webhook_url: "https://example.com/hook", webhook_secret: "test-secret" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: singleFn })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })),
      })),
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve("OK"),
      headers: new Headers(),
    });

    await sendWebhook("biz-1", validPayload);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/hook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-WitaLine-Event": "call.completed",
          "User-Agent": "WitaLine-Webhook/1.0",
        }),
      }),
    );
  });

  it("returns success on 200 response", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const singleFn = vi.fn().mockResolvedValue({ data: { webhook_url: "https://example.com/hook", webhook_secret: "test-secret" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: singleFn })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })),
      })),
    });

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve("OK"),
      headers: new Headers(),
    });

    const result = await sendWebhook("biz-1", validPayload);
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it("returns success: false on network error", async () => {
    const { supabaseAdmin } = await import("../supabase-admin");
    const singleFn = vi.fn().mockResolvedValue({ data: { webhook_url: "https://example.com/hook", webhook_secret: "test-secret" }, error: null });
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: singleFn })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null }) })),
      })),
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await sendWebhook("biz-1", validPayload);
    expect(result.success).toBe(false);
  });
});
