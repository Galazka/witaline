// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminRealCosts from "../AdminRealCosts";

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

const mockBizData = {
  businesses: [
    {
      id: "1", name: "Firma A", plan: "elastic_0", is_centrala: false, calls: 10,
      minutes: 45.5, costElevenlabs: 12.5, costTwilio: 3.2, costOpenrouter: 1.8,
      costSms: 0.5, totalCost: 18, revenue: 0, customRevenue: null,
      prevTotalCost: null, prevRevenue: null, prevCalls: null,
    },
    {
      id: "2", name: "Firma B", plan: "business", is_centrala: false, calls: 25,
      minutes: 120, costElevenlabs: 35, costTwilio: 8.4, costOpenrouter: 5,
      costSms: 2, totalCost: 50.4, revenue: 199, customRevenue: 150,
      prevTotalCost: null, prevRevenue: null, prevCalls: null,
    },
    {
      id: "centrala", name: "Centrala", plan: "elastic_0", is_centrala: true,
      calls: 5, minutes: 20, costElevenlabs: 6, costTwilio: 1.5, costOpenrouter: 0.8,
      costSms: 0, totalCost: 8.3, revenue: 0, customRevenue: null,
      prevTotalCost: null, prevRevenue: null, prevCalls: null,
    },
  ],
  own_costs: null,
  cost_items: [],
  call_logs: [
    {
      id: "c1", business_id: "1", duration_seconds: 120,
      cost_pln: 0, cost_elevenlabs: 2.5, cost_twilio: 0.6, cost_openrouter: 0.3,
      total_cost: 3.4, revenue_pln: 0, from_number: "+48123456789",
      created_at: "2026-07-01T10:30:00Z", business_name: "Firma A",
    },
  ],
};

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
}

describe("AdminRealCosts", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("shows loading then renders business names", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    expect(screen.getByText("Ladowanie...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Koszt uslug")).toBeInTheDocument();
    });
    expect(screen.getByText("Odswiez")).toBeInTheDocument();
  });

  it("shows empty state when no data", async () => {
    vi.stubGlobal("fetch", mockFetchOk({ businesses: [], own_costs: null, cost_items: [], call_logs: [] }));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByText("Brak danych")).toBeInTheDocument(); });
  });

  it("renders KPI cards", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByText("Koszt uslug")).toBeInTheDocument(); });
    expect(screen.getAllByText("Marza").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rozmowy").length).toBeGreaterThanOrEqual(1);
  });

  it("filters businesses by search", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByText("Koszt uslug")).toBeInTheDocument(); });
    const searchInput = screen.getByPlaceholderText("Szukaj firmy...");
    fireEvent.change(searchInput, { target: { value: "Firma B" } });
    expect(screen.getAllByText("Firma B").length).toBeGreaterThanOrEqual(1);
  });

  it("renders action buttons", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByText("Sync koszty")).toBeInTheDocument(); });
    expect(screen.getByText("Odswiez")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
  });

  it("expands business row to show call details", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByText("Koszt uslug")).toBeInTheDocument(); });
    const buttons = screen.getAllByText("Firma A");
    const bizButton = buttons.find((el) => el.closest("button")) || buttons[0];
    fireEvent.click(bizButton.closest("button") || bizButton);
    await waitFor(() => { expect(screen.getByText("Szczegoly polaczen")).toBeInTheDocument(); });
  });

  it("switches currency on dropdown change", async () => {
    vi.stubGlobal("fetch", mockFetchOk(mockBizData));
    render(<AdminRealCosts />);
    await waitFor(() => { expect(screen.getByTitle("Wyświetl w")).toBeInTheDocument(); });
    const select = screen.getByTitle("Wyświetl w") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "PLN" } });
    expect(select.value).toBe("PLN");
  });
});
