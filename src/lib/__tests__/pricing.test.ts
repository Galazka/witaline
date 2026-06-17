import { describe, it, expect } from "vitest";
import {
  getElasticRate,
  calculateElasticPrice,
  getPlanConfig,
  calculateTokenCost,
  calculateOverflowCost,
  calculateDiscountedPrice,
  applyCouponToPrice,
  calculateSelfServicePrice,
  calculateEnterprisePrice,
  ELASTIC_TIERS,
  INTERNAL_COST_PER_MIN,
  CONFIG,
} from "../pricing";

describe("ELASTIC_TIERS", () => {
  it("has correct number of tiers", () => {
    expect(ELASTIC_TIERS.length).toBe(5);
  });

  it("first tier rate is 1.49", () => {
    expect(ELASTIC_TIERS[0].ratePerMin).toBe(1.49);
  });

  it("last tier rate is 0.99", () => {
    expect(ELASTIC_TIERS[ELASTIC_TIERS.length - 1].ratePerMin).toBe(0.99);
  });

  it("covers 0 to 5000 minutes", () => {
    expect(ELASTIC_TIERS[0].minMinutes).toBe(0);
    expect(ELASTIC_TIERS[ELASTIC_TIERS.length - 1].maxMinutes).toBe(5000);
  });
});

describe("getElasticRate", () => {
  it("returns 1.49 for 0 minutes", () => {
    expect(getElasticRate(0)).toBe(1.49);
  });

  it("returns 1.49 for 50 minutes", () => {
    expect(getElasticRate(50)).toBe(1.49);
  });

  it("returns 1.49 for 100 minutes", () => {
    expect(getElasticRate(100)).toBe(1.49);
  });

  it("returns 0.99 for 5000 minutes", () => {
    expect(getElasticRate(5000)).toBe(0.99);
  });

  it("falls back to 0.99 above 5000", () => {
    expect(getElasticRate(9999)).toBe(0.99);
  });

  it("every tier rate >= INTERNAL_COST_PER_MIN", () => {
    for (const t of ELASTIC_TIERS) {
      expect(t.ratePerMin).toBeGreaterThan(INTERNAL_COST_PER_MIN);
    }
  });

  it("minimum margin >= 34% for every tier", () => {
    for (const t of ELASTIC_TIERS) {
      const margin = (t.ratePerMin - INTERNAL_COST_PER_MIN) / t.ratePerMin;
      expect(margin).toBeGreaterThanOrEqual(0.34);
    }
  });
});

describe("calculateElasticPrice", () => {
  it("returns correct values for 100 min", () => {
    const r = calculateElasticPrice(100);
    expect(r.ratePerMin).toBe(1.49);
    expect(r.monthlyNetto).toBe(149);
    expect(r.monthlyBrutto).toBe(183.27);
    expect(r.costTotal).toBe(65);
    expect(r.profitTotal).toBe(84);
    expect(r.marginPercent).toBe(56);
  });

  it("returns correct values for 1000 min", () => {
    const r = calculateElasticPrice(1000);
    expect(r.ratePerMin).toBe(1.19);
    expect(r.monthlyNetto).toBe(1190);
    expect(r.monthlyBrutto).toBe(1463.70);
    expect(r.costTotal).toBe(650);
    expect(r.profitTotal).toBe(540);
    expect(r.marginPercent).toBe(45);
  });
});

describe("getPlanConfig", () => {
  it("start_100 plan has correct price", () => {
    const p = getPlanConfig("start_100");
    expect(p.pricePLN).toBe(199);
  });

  it("all plans have costPerToken = 0.00065", () => {
    const keys: Array<keyof typeof import("../pricing")["plans"]> = ["start_100", "pro_500", "pro_249", "lux_599", "enterprise_2000", "elastic_0"];
    for (const k of keys) {
      const p = getPlanConfig(k);
      expect(p.costPerToken).toBe(0.00065);
    }
  });

  it("all fixed plans have positive pricePLN", () => {
    for (const k of ["start_100", "pro_500", "pro_249", "lux_599", "enterprise_2000"] as const) {
      expect(getPlanConfig(k).pricePLN).toBeGreaterThan(0);
    }
  });
});

describe("calculateTokenCost", () => {
  it("1 min = 1000 tokens", () => {
    expect(calculateTokenCost(60, "start_100")).toBe(0.65);
  });

  it("5 min = 5000 tokens", () => {
    expect(calculateTokenCost(300, "start_100")).toBe(3.25);
  });
});

describe("calculateOverflowCost", () => {
  it("1000 excess tokens at start rate", () => {
    expect(calculateOverflowCost(1000, "start_100")).toBe(1.80);
  });
});

describe("calculateDiscountedPrice", () => {
  it("50% off start_100 = 99.50", () => {
    expect(calculateDiscountedPrice("start_100", 50)).toBe(99.50);
  });

  it("100% off = 0", () => {
    expect(calculateDiscountedPrice("start_100", 100)).toBe(0);
  });

  it("0% off = full price", () => {
    expect(calculateDiscountedPrice("start_100", 0)).toBe(199);
  });
});

describe("applyCouponToPrice", () => {
  it("percent discount", () => {
    expect(applyCouponToPrice(299, { discount_percent: 20 })).toBe(239.20);
  });

  it("fixed discount", () => {
    expect(applyCouponToPrice(299, { discount_amount: 50 })).toBe(249);
  });

  it("fixed discount caps at 0", () => {
    expect(applyCouponToPrice(100, { discount_amount: 200 })).toBe(0);
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
    expect(r.monthlyNetto).toBe(149);
    expect(r.monthlyBrutto).toBe(183.27);
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
    const addonTotal = CONFIG.addonOwnNumber + CONFIG.addonGoogleCalendar + CONFIG.addonCrm + CONFIG.addonVoiceClone + CONFIG.addonUnlimitedConsultants + CONFIG.addonPrioritySupport + CONFIG.addonSla247;
    expect(r.monthlyNetto).toBe(149 + addonTotal);
  });
});

describe("calculateEnterprisePrice", () => {
  it("1000 min with setup fee", () => {
    const r = calculateEnterprisePrice(1000, true);
    expect(r.setupFee).toBe(CONFIG.enterpriseSetupFee);
    expect(r.monthlyNetto).toBeGreaterThanOrEqual(CONFIG.enterpriseMinMonthly);
    expect(r.monthlyBrutto).toBeGreaterThan(r.monthlyNetto);
  });

  it("2000 min without setup", () => {
    const r = calculateEnterprisePrice(2000, false);
    expect(r.setupFee).toBe(0);
    expect(r.monthlyNetto).toBeGreaterThanOrEqual(CONFIG.enterpriseMinMonthly);
  });
});
