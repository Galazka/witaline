// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminDailyCosts from "../AdminDailyCosts";

vi.mock("@/lib/exchange-rates", () => ({
  getExchangeRates: vi.fn(() =>
    Promise.resolve({
      usdPln: 4.15,
      eurPln: 4.52,
      plnUsd: 1 / 4.15,
      plnEur: 1 / 4.52,
      eurUsd: 4.52 / 4.15,
      usdEur: 4.15 / 4.52,
      fetchedAt: "2026-07-03T10:00:00.000Z",
    })
  ),
  convertToPln: vi.fn((amount: number) => amount * 4.15),
  convertPln: vi.fn((amount: number) => amount / 4.15),
  formatCurrency: vi.fn((amount: number) => `${amount.toFixed(2)} $`),
}));

vi.mock("@/lib/pricing", () => ({
  plans: {},
  getPlanConfig: vi.fn(() => ({ price: 199, label: "Biznes" })),
}));

const mockCallLogs = [
  {
    id: "cl1", business_id: "1", business_name: "Firma A",
    duration_seconds: 120, cost_elevenlabs: 2.5, cost_twilio: 0.6,
    cost_openrouter: 0.3,
    total_cost: 3.4, revenue_pln: 0, plan_revenue_pln: 0,
    internal_cost_pln: 1.3, from_number: "+48123456789",
    created_at: "2026-07-01T10:30:00Z", classification: "zapytanie_ofertowe",
  },
  {
    id: "cl2", business_id: "2", business_name: "Firma B",
    duration_seconds: 300, cost_elevenlabs: 5, cost_twilio: 1.2,
    cost_openrouter: 0.6,
    total_cost: 6.8, revenue_pln: 199, plan_revenue_pln: 199,
    internal_cost_pln: 3.25, from_number: "+48987654321",
    created_at: "2026-07-02T14:00:00Z", classification: "reklamacja",
  },
];

const mockApiResponse = {
  call_logs: mockCallLogs,
  sms_total: 5,
  cost_sms_total: 2.5,
  businesses: [{ id: "1", name: "Firma A" }, { id: "2", name: "Firma B" }],
  total_call_logs: 3,
};

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
}

describe("AdminDailyCosts", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("shows loading then renders KPI section", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockApiResponse));
    render(<AdminDailyCosts />);
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    await waitFor(() => { expect(screen.getAllByText(/Koszt/).length).toBeGreaterThanOrEqual(1); });
  });

  it("shows empty state when no data", async () => {
    vi.stubGlobal("fetch", mockFetchOk({ call_logs: [], sms_total: 0, cost_sms_total: 0, businesses: [], total_call_logs: 0 }));
    render(<AdminDailyCosts />);
    await waitFor(() => { expect(screen.getByText("Brak danych w wybranym zakresie")).toBeInTheDocument(); });
  });

  it("shows SMS KPI section", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockApiResponse));
    render(<AdminDailyCosts />);
    await waitFor(() => { expect(screen.getByText("SMS wysłane")).toBeInTheDocument(); });
  });

  it("renders action buttons", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockApiResponse));
    render(<AdminDailyCosts />);
    await waitFor(() => { expect(screen.getByText("Odśwież")).toBeInTheDocument(); });
    expect(screen.getByText("Sync koszty")).toBeInTheDocument();
  });

  it("shows fetch error state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve({ error: "Brak dostępu" }) }));
    render(<AdminDailyCosts />);
    await waitFor(() => { expect(screen.getByText(/Błąd 403/)).toBeInTheDocument(); });
  });

  it("handles API fetch rejection gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    render(<AdminDailyCosts />);
    await waitFor(() => { expect(screen.getByText("Nie udało się połączyć z API")).toBeInTheDocument(); });
  });
});
