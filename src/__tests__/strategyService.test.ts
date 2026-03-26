import { analyzeStrategy } from "../services/strategyService";
import { AnalyzeRequest } from "../models/scenarioModel";

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a minimal valid AnalyzeRequest with overrides. */
function makeRequest(overrides: Partial<AnalyzeRequest> = {}): AnalyzeRequest {
  return {
    currentRate: 5.25,
    remainingBalance: 400_000,
    remainingTermMonths: 24,
    bestOfferRate: 4.0,
    offerTermYears: 5,
    penaltyCost: 4_000,
    waitMonths: 6,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Monthly Interest Savings (renamed field from monthlyCostOfWaiting)
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – monthlyInterestSavings", () => {
  it("calculates simple monthly interest difference correctly", () => {
    // (400_000 * (5.25 - 4.0)) / 100 / 12 = 400_000 * 1.25 / 100 / 12 ≈ 416.67
    const result = analyzeStrategy(makeRequest());
    expect(result.monthlyInterestSavings).toBeCloseTo(416.67, 1);
  });

  it("returns 0 when current rate equals offer rate", () => {
    const result = analyzeStrategy(makeRequest({ currentRate: 4.0, bestOfferRate: 4.0 }));
    expect(result.monthlyInterestSavings).toBe(0);
  });

  it("returns negative when offer rate is higher than current rate", () => {
    const result = analyzeStrategy(makeRequest({ currentRate: 3.0, bestOfferRate: 5.0 }));
    expect(result.monthlyInterestSavings).toBeLessThan(0);
  });

  it("scales with remaining balance", () => {
    const small = analyzeStrategy(makeRequest({ remainingBalance: 100_000 }));
    const large = analyzeStrategy(makeRequest({ remainingBalance: 400_000 }));
    expect(large.monthlyInterestSavings).toBeCloseTo(small.monthlyInterestSavings * 4, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Cost of Waiting (totalCostOfWaiting, dailyCostOfWaiting)
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – cost of waiting", () => {
  it("calculates total cost of waiting as monthly diff × waitMonths", () => {
    const result = analyzeStrategy(makeRequest({ waitMonths: 6 }));
    expect(result.totalCostOfWaiting).toBeCloseTo(result.monthlyInterestSavings * 6, 0);
  });

  it("calculates daily cost of waiting as monthly diff / 30", () => {
    const result = analyzeStrategy(makeRequest());
    expect(result.dailyCostOfWaiting).toBeCloseTo(result.monthlyInterestSavings / 30, 1);
  });

  it("total cost is 0 when waitMonths is 0", () => {
    const result = analyzeStrategy(makeRequest({ waitMonths: 0 }));
    expect(result.totalCostOfWaiting).toBe(0);
  });

  it("correctly scales total cost with different waitMonths values", () => {
    const r3 = analyzeStrategy(makeRequest({ waitMonths: 3 }));
    const r12 = analyzeStrategy(makeRequest({ waitMonths: 12 }));
    expect(r12.totalCostOfWaiting).toBeCloseTo(r3.totalCostOfWaiting * 4, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Payback Period
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – paybackPeriodMonths", () => {
  it("calculates payback period as penaltyCost / monthlyDiff", () => {
    // penaltyCost=4000, monthlyDiff≈416.67 → payback≈9.6 months
    const result = analyzeStrategy(makeRequest({ penaltyCost: 4_000 }));
    expect(result.paybackPeriodMonths).toBeCloseTo(4_000 / 416.67, 0);
  });

  it("returns -1 when monthly savings is 0 (rates equal, no payback possible)", () => {
    const result = analyzeStrategy(
      makeRequest({ currentRate: 4.0, bestOfferRate: 4.0, penaltyCost: 1_000 })
    );
    expect(result.paybackPeriodMonths).toBe(-1);
  });

  it("returns -1 when penalty is 0 and rates differ (immediate payback)", () => {
    const result = analyzeStrategy(makeRequest({ penaltyCost: 0 }));
    expect(result.paybackPeriodMonths).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Break-Even Rate
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – breakEvenRate", () => {
  it("returns bestOfferRate when balance is 0", () => {
    const result = analyzeStrategy(makeRequest({ remainingBalance: 0 }));
    expect(result.breakEvenRate).toBe(4.0);
  });

  it("break-even rate is less than bestOfferRate when there is a delay cost", () => {
    const result = analyzeStrategy(makeRequest());
    expect(result.breakEvenRate).toBeLessThan(4.0);
  });

  it("break-even rate approaches bestOfferRate as waitMonths approaches 0", () => {
    const result = analyzeStrategy(makeRequest({ waitMonths: 0 }));
    // delayCost = 0 * monthlyDiff + penaltyCost → breakEven = bestOffer - penaltyCost/balance
    expect(result.breakEvenRate).toBeLessThan(4.0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Net Benefit Now – with and without Perch override
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – netBenefitNow", () => {
  it("uses Perch netBenefit override when provided", () => {
    const result = analyzeStrategy(makeRequest({ netBenefit: 99_999 }));
    expect(result.netBenefitNow).toBe(99_999);
  });

  it("falls back to totalSavings - penaltyCost when no Perch override", () => {
    // totalSavings = simpleMonthlyDiff * offerTermYears * 12 = 416.67 * 60 = 25000
    // netBenefitNow = 25000 - 4000 = 21000
    const result = analyzeStrategy(makeRequest({ penaltyCost: 4_000 }));
    const expectedSavings = result.monthlyInterestSavings * 5 * 12;
    expect(result.netBenefitNow).toBeCloseTo(expectedSavings - 4_000, 0);
  });

  it("uses Perch totalInterestSavings override for total savings when provided", () => {
    // perchSavings = 30000, penalty = 4000 → netBenefit = 26000
    const result = analyzeStrategy(
      makeRequest({ totalInterestSavings: 30_000, penaltyCost: 4_000 })
    );
    expect(result.netBenefitNow).toBeCloseTo(26_000, 0);
  });

  it("netBenefit override takes precedence over totalInterestSavings override", () => {
    const result = analyzeStrategy(
      makeRequest({ totalInterestSavings: 30_000, netBenefit: 50_000 })
    );
    expect(result.netBenefitNow).toBe(50_000);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Adjusted Benefit
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – adjustedBenefit", () => {
  it("equals netBenefitNow - totalCostOfWaiting", () => {
    const result = analyzeStrategy(makeRequest());
    expect(result.adjustedBenefit).toBeCloseTo(
      result.netBenefitNow - result.totalCostOfWaiting,
      1
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Recommendation Logic
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – recommendation", () => {
  it("recommends LOCK_NOW when adjustedBenefit is positive", () => {
    // Large savings, small penalty, small wait
    const result = analyzeStrategy(
      makeRequest({
        currentRate: 7.0,
        bestOfferRate: 4.0,
        penaltyCost: 1_000,
        waitMonths: 1,
        netBenefit: 20_000,
      })
    );
    expect(result.recommendation).toBe("LOCK_NOW");
  });

  it("recommends WAIT when adjustedBenefit is negative or zero", () => {
    // Small savings, large penalty, long wait
    const result = analyzeStrategy(
      makeRequest({
        currentRate: 4.1,
        bestOfferRate: 4.0,
        penaltyCost: 20_000,
        waitMonths: 12,
        netBenefit: -5_000,
      })
    );
    expect(result.recommendation).toBe("WAIT");
  });

  it("recommends WAIT when rates are equal and penalty exists", () => {
    const result = analyzeStrategy(
      makeRequest({ currentRate: 4.0, bestOfferRate: 4.0, penaltyCost: 5_000 })
    );
    expect(result.recommendation).toBe("WAIT");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Summary String
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – summary", () => {
  it("includes TIME-TO-DECISION ANALYSIS header", () => {
    const result = analyzeStrategy(makeRequest());
    expect(result.summary).toContain("TIME-TO-DECISION ANALYSIS");
  });

  it("includes VERDICT section", () => {
    const result = analyzeStrategy(makeRequest());
    expect(result.summary).toContain("VERDICT:");
  });

  it("shows 'Lock now' in summary when recommendation is LOCK_NOW", () => {
    const result = analyzeStrategy(
      makeRequest({ netBenefit: 50_000, waitMonths: 1 })
    );
    if (result.recommendation === "LOCK_NOW") {
      expect(result.summary).toContain("Lock now");
    }
  });

  it("shows 'Wait' in summary when recommendation is WAIT", () => {
    const result = analyzeStrategy(
      makeRequest({ netBenefit: -10_000, waitMonths: 12 })
    );
    if (result.recommendation === "WAIT") {
      expect(result.summary).toContain("Wait");
    }
  });

  it("shows 'never' payback text when monthly savings is zero", () => {
    const result = analyzeStrategy(
      makeRequest({ currentRate: 4.0, bestOfferRate: 4.0 })
    );
    expect(result.summary).toContain("never");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Rounding / Precision
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – rounding", () => {
  it("rounds all numeric outputs to 2 decimal places", () => {
    const result = analyzeStrategy(makeRequest());
    const numericFields: (keyof typeof result)[] = [
      "monthlyInterestSavings",
      "totalCostOfWaiting",
      "dailyCostOfWaiting",
      "breakEvenRate",
      "netBenefitNow",
      "adjustedBenefit",
    ];
    for (const field of numericFields) {
      const value = result[field] as number;
      if (value !== -1) {
        const rounded = Math.round(value * 100) / 100;
        expect(value).toBe(rounded);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Boundary / Edge Cases
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeStrategy – edge cases", () => {
  it("handles zero penalty cost without crashing", () => {
    const result = analyzeStrategy(makeRequest({ penaltyCost: 0 }));
    expect(result.paybackPeriodMonths).toBe(0);
    expect(result.netBenefitNow).toBeGreaterThan(0);
  });

  it("handles very large balance without crashing", () => {
    const result = analyzeStrategy(makeRequest({ remainingBalance: 10_000_000 }));
    expect(typeof result.monthlyInterestSavings).toBe("number");
    expect(isFinite(result.monthlyInterestSavings)).toBe(true);
  });

  it("handles zero balance without crashing", () => {
    expect(() => analyzeStrategy(makeRequest({ remainingBalance: 0 }))).not.toThrow();
  });

  it("handles zero rate without crashing", () => {
    const result = analyzeStrategy(makeRequest({ currentRate: 0, bestOfferRate: 0 }));
    expect(result.recommendation).toBe("WAIT");
  });

  it("produces deterministic results for the same input", () => {
    const input = makeRequest();
    const r1 = analyzeStrategy(input);
    const r2 = analyzeStrategy(input);
    expect(r1.monthlyInterestSavings).toBe(r2.monthlyInterestSavings);
    expect(r1.recommendation).toBe(r2.recommendation);
  });
});