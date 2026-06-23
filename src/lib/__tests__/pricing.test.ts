import { describe, it, expect } from "vitest";
import {
  getElasticRate,
  calculateElasticPrice,
  getPlanConfig,
  calculateSelfServicePrice,
  calculateCost,
  getPlanOverageRate,
  getUsedPercentage,
  formatPLN,
  formatPrice,
  formatPriceCurrency,
  formatPriceMin,
  convertPrice,
  ELASTIC_TIERS,
  INTERNAL_COST_PER_MIN,
  CONFIG,
  PLANS,
  plans,
  ADDONS,
} from "../pricing";

describe("ELASTIC_TIERS", () => {
  it("has correct number of tiers", () => {
    expect(ELASTIC_TIERS.length).toBe(6);
  });

  it("first tier rate is 1.20", () => {
    expect(ELASTIC_TIERS[0].ratePerMin).toBe(1.20);
  });

  it("last tier rate is 0.85", () => {
    expect(ELASTIC_TIERS[ELASTIC_TIERS.length - 1].ratePerMin).toBe(0.85);
  });

  it("covers 0 to Infinity", () => {
    expect(ELASTIC_TIERS[0].minMinutes).toBe(0);
    expect(ELASTIC_TIERS[ELASTIC_TIERS.length - 1].maxMinutes).toBe(Infinity);
  });
});

describe("getElasticRate", () => {
  it("returns 1.20 for 0 minutes", () => {
    expect(getElasticRate(0)).toBe(1.20);
  });

  it("returns 1.20 for 250 minutes", () => {
    expect(getElasticRate(250)).toBe(1.20);
  });

  it("returns 1.10 for 750 minutes", () => {
    expect(getElasticRate(750)).toBe(1.10);
  });

  it("returns 0.90 for 5000 minutes", () => {
    expect(getElasticRate(5000)).toBe(0.90);
  });

  it("falls back to 0.85 above 5000", () => {
    expect(getElasticRate(9999)).toBe(0.85);
  });

  it("every tier rate > INTERNAL_COST_PER_MIN", () => {
    for (const t of ELASTIC_TIERS) {
      expect(t.ratePerMin).toBeGreaterThan(INTERNAL_COST_PER_MIN);
    }
  });

  it("every tier margin >= 20%", () => {
    for (const t of ELASTIC_TIERS) {
      const margin = (t.ratePerMin - INTERNAL_COST_PER_MIN) / t.ratePerMin;
      expect(margin).toBeGreaterThanOrEqual(0.20);
      expect(margin).toBeLessThan(1);
    }
  });
});

describe("calculateElasticPrice", () => {
  it("returns correct values for 100 min", () => {
    const r = calculateElasticPrice(100);
    expect(r.ratePerMin).toBe(1.20);
    expect(r.monthlyNetto).toBe(120);
    expect(r.monthlyBrutto).toBe(147.60);
    expect(r.costTotal).toBe(65);
    expect(r.profitTotal).toBe(55);
    expect(r.marginPercent).toBe(46);
  });

  it("returns correct values for 1500 min", () => {
    const r = calculateElasticPrice(1500);
    expect(r.ratePerMin).toBe(1.00);
    expect(r.monthlyNetto).toBe(1500);
    expect(r.monthlyBrutto).toBe(1845);
    expect(r.costTotal).toBe(975);
    expect(r.profitTotal).toBe(525);
    expect(r.marginPercent).toBe(35);
  });
});

describe("getPlanConfig", () => {
  it("start plan has correct price", () => {
    const p = getPlanConfig("start");
    expect(p.price).toBe(199);
  });

  it("returns plan with expected fields", () => {
    const p = getPlanConfig("growth");
    expect(p.label).toBe("Growth");
    expect(p.minutes).toBe(600);
    expect(p.overagePerToken).toBe(0.001);
  });

  it("all fixed plans have positive price", () => {
    for (const key of ["start", "pro", "growth", "lux", "enterprise"]) {
      expect(getPlanConfig(key).price).toBeGreaterThan(0);
    }
  });
});

describe("getPlanOverageRate", () => {
  it("returns correct overage for growth", () => {
    expect(getPlanOverageRate("growth")).toBe(0.001);
  });

  it("falls back to default for unknown plan", () => {
    expect(getPlanOverageRate("unknown_plan")).toBe(0.002);
  });
});

describe("calculateCost", () => {
  it("calculates cost by duration and plan", () => {
    const cost = calculateCost(600, "growth"); // 10 min
    expect(cost).toBeGreaterThan(0);
  });

  it("uses elastic rate for elastic plan prefix", () => {
    const cost = calculateCost(600, "elastic");
    expect(cost).toBe(10 * 1.20); // 10 min * first tier rate
  });
});

describe("getUsedPercentage", () => {
  it("returns 0 when total is 0", () => {
    expect(getUsedPercentage(50, 0)).toBe(0);
  });

  it("caps at 100", () => {
    expect(getUsedPercentage(200, 100)).toBe(100);
  });

  it("calculates correct percentage", () => {
    expect(getUsedPercentage(30, 300)).toBe(10);
  });
});

describe("formatPLN", () => {
  it("formats number to PLN string", () => {
    expect(formatPLN(199)).toBe("199 PLN");
  });
});

describe("formatPrice", () => {
  it("formats price with Polish locale", () => {
    expect(formatPrice(199, "pl")).toBe("199,00 PLN");
  });
});

describe("formatPriceCurrency", () => {
  it("formats PLN", () => {
    expect(formatPriceCurrency(100, "pln", "pl")).toBe("100,00 zł");
  });
});

describe("formatPriceMin", () => {
  it("formats per-minute PLN", () => {
    expect(formatPriceMin(1.20, "pln")).toBe("1,20 zł/min");
  });
});

describe("convertPrice", () => {
  it("converts PLN to EUR", () => {
    expect(convertPrice(100, "eur")).toBe(23);
  });
});

describe("calculateSelfServicePrice", () => {
  it("base 100 min without addons", () => {
    const r = calculateSelfServicePrice({
      minutes: 100,
      ownNumber: false,
      googleCalendar: false,
      crm: false,
      voiceClone: false,
      unlimitedConsultants: false,
      prioritySupport: false,
      sla247: false,
    });
    expect(r.monthlyNetto).toBe(120);
    expect(r.monthlyBrutto).toBe(147.60);
    expect(r.overageNetto).toBe(1.20);
  });

  it("100 min with all addons", () => {
    const r = calculateSelfServicePrice({
      minutes: 100,
      ownNumber: true,
      googleCalendar: true,
      crm: true,
      voiceClone: true,
      unlimitedConsultants: true,
      prioritySupport: true,
      sla247: true,
    });
    const addonTotal =
      CONFIG.addonOwnNumber + CONFIG.addonGoogleCalendar +
      CONFIG.addonCrm + CONFIG.addonVoiceClone +
      CONFIG.addonUnlimitedConsultants + CONFIG.addonPrioritySupport +
      CONFIG.addonSla247;
    expect(r.monthlyNetto).toBe(120 + addonTotal);
    expect(r.details.length).toBe(8); // base + 7 addons
  });
});
