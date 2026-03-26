/**
 * Tests for strategyController.ts
 *
 * The environment blocks loopback network connections, so we test the
 * exported `analyzeFull` handler directly by constructing mock Express
 * Request / Response objects instead of using an HTTP client.
 */

// ── Mock external services before importing the controller ─────────────
jest.mock("../services/pathfinderService", () => ({
  fetchPathfinderOffers: jest.fn(),
}));
jest.mock("../services/penaltyService", () => ({
  fetchPenaltyCost: jest.fn(),
}));

import { Request, Response } from "express";
import { fetchPathfinderOffers } from "../services/pathfinderService";
import { fetchPenaltyCost } from "../services/penaltyService";
import { analyzeFull } from "../controllers/strategyController";

const mockFetchPathfinderOffers = fetchPathfinderOffers as jest.Mock;
const mockFetchPenaltyCost = fetchPenaltyCost as jest.Mock;

// ── Mock factory helpers ────────────────────────────────────────────────

interface MockResponse {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (data: unknown) => void;
}

function makeMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
    },
  };
  return res;
}

function makeMockReq(body: Record<string, unknown>): Partial<Request> {
  return { body } as Partial<Request>;
}

// ── Future date helper ──────────────────────────────────────────────────

function futureDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// ── Valid request body ──────────────────────────────────────────────────

const VALID_BODY: Record<string, unknown> = {
  currentRate: 5.25,
  remainingBalance: 400_000,
  maturityDate: futureDate(24),
  homeValue: 800_000,
  waitMonths: 6,
  lender: "TD Canada Trust",
  mortgageRateType: "Fixed",
};

// ── Default mock returns ────────────────────────────────────────────────

const MOCK_PATHFINDER_RESULT = {
  offers: [{ lender: "RBC", netRate: 4.09, termYears: 5, totalSavings: 25_000 }],
  bestOffer: { lender: "RBC", netRate: 4.09, termYears: 5, totalSavings: 25_000 },
};

const MOCK_PENALTY_RESULT = {
  totalPenalty: 3_500,
  oldInterest: 10_000,
  newInterest: 6_500,
  difference: 3_500,
  totalRaw: 21_500,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchPathfinderOffers.mockResolvedValue(MOCK_PATHFINDER_RESULT);
  mockFetchPenaltyCost.mockResolvedValue(MOCK_PENALTY_RESULT);
});

// ═══════════════════════════════════════════════════════════════════════
// Validation – validatePrecisionRequest (all 7 required fields)
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – validation (validatePrecisionRequest)", () => {
  const REQUIRED_FIELDS = [
    "currentRate",
    "remainingBalance",
    "maturityDate",
    "homeValue",
    "waitMonths",
    "lender",
    "mortgageRateType",
  ] as const;

  for (const field of REQUIRED_FIELDS) {
    it(`returns 400 when '${field}' is missing`, async () => {
      const body = { ...VALID_BODY };
      delete body[field];

      const req = makeMockReq(body);
      const res = makeMockRes();

      await analyzeFull(req as Request, res as unknown as Response);

      expect(res.statusCode).toBe(400);
      const responseBody = res.body as { error: string; details: string[] };
      expect(responseBody.error).toBe("Validation failed");
      expect(responseBody.details).toEqual(
        expect.arrayContaining([expect.stringContaining(field)])
      );
    });
  }

  it("returns 400 with all 7 fields listed when body is empty", async () => {
    const req = makeMockReq({});
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { error: string; details: string[] };
    expect(responseBody.details.length).toBeGreaterThanOrEqual(7);
  });

  it("returns 400 when currentRate is a string, not a number", async () => {
    const req = makeMockReq({ ...VALID_BODY, currentRate: "five" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { details: string[] };
    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.stringContaining("currentRate")])
    );
  });

  it("returns 400 when remainingBalance is a string", async () => {
    const req = makeMockReq({ ...VALID_BODY, remainingBalance: "lots" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { details: string[] };
    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.stringContaining("remainingBalance")])
    );
  });

  it("returns 400 when homeValue is a string", async () => {
    const req = makeMockReq({ ...VALID_BODY, homeValue: "expensive" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { details: string[] };
    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.stringContaining("homeValue")])
    );
  });

  it("returns 400 when maturityDate is a number, not a string", async () => {
    const req = makeMockReq({ ...VALID_BODY, maturityDate: 20280325 });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { details: string[] };
    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.stringContaining("maturityDate")])
    );
  });

  it("returns 400 when mortgageRateType is an invalid value", async () => {
    const req = makeMockReq({ ...VALID_BODY, mortgageRateType: "Adjustable" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(400);
    const responseBody = res.body as { details: string[] };
    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.stringContaining("mortgageRateType")])
    );
  });

  it("does not return 400 when mortgageRateType is 'Variable'", async () => {
    const req = makeMockReq({ ...VALID_BODY, mortgageRateType: "Variable" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).not.toBe(400);
  });

  it("does not return 400 when mortgageRateType is 'Fixed'", async () => {
    const req = makeMockReq({ ...VALID_BODY, mortgageRateType: "Fixed" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).not.toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Smart Defaults (hard-coded values passed to APIs)
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – smart defaults", () => {
  it("calls fetchPathfinderOffers with city='Toronto' and province='ON'", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPathfinderOffers).toHaveBeenCalledTimes(1);
    expect(mockFetchPathfinderOffers).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Toronto", province: "ON" })
    );
  });

  it("calls fetchPathfinderOffers with hasDefaultInsurance=false", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPathfinderOffers).toHaveBeenCalledWith(
      expect.objectContaining({ hasDefaultInsurance: false })
    );
  });

  it("calls fetchPathfinderOffers with isOwnerOccupied=true", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPathfinderOffers).toHaveBeenCalledWith(
      expect.objectContaining({ isOwnerOccupied: true })
    );
  });

  it("calls fetchPenaltyCost with originalTermYears=5", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ originalTermYears: 5 })
    );
  });

  it("calls fetchPenaltyCost with paymentFrequency='Monthly'", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ paymentFrequency: "Monthly" })
    );
  });

  it("calls fetchPenaltyCost with newMortgageRateType='Fixed'", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ newMortgageRateType: "Fixed" })
    );
  });

  it("passes user-supplied remainingBalance to both APIs", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPathfinderOffers).toHaveBeenCalledWith(
      expect.objectContaining({ mortgagePrincipal: VALID_BODY.remainingBalance })
    );
    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ mortgagePrincipal: VALID_BODY.remainingBalance })
    );
  });

  it("passes user-supplied lender to both APIs", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPathfinderOffers).toHaveBeenCalledWith(
      expect.objectContaining({ currentLender: VALID_BODY.lender })
    );
    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ lender: VALID_BODY.lender })
    );
  });

  it("uses bestOffer.netRate from Pathfinder as newMortgageRate for penalty", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPenaltyCost).toHaveBeenCalledWith(
      expect.objectContaining({ newMortgageRate: MOCK_PATHFINDER_RESULT.bestOffer.netRate })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Successful Response Shape
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – successful response", () => {
  it("responds with 200 status code on a valid request", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(200);
  });

  it("response includes monthlyInterestSavings (renamed field)", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty("monthlyInterestSavings");
    expect(body).not.toHaveProperty("monthlyCostOfWaiting");
  });

  it("response includes all AnalyzeResponse fields", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty("monthlyInterestSavings");
    expect(body).toHaveProperty("totalCostOfWaiting");
    expect(body).toHaveProperty("dailyCostOfWaiting");
    expect(body).toHaveProperty("paybackPeriodMonths");
    expect(body).toHaveProperty("breakEvenRate");
    expect(body).toHaveProperty("netBenefitNow");
    expect(body).toHaveProperty("adjustedBenefit");
    expect(body).toHaveProperty("recommendation");
    expect(body).toHaveProperty("summary");
  });

  it("recommendation is either LOCK_NOW or WAIT", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const body = res.body as { recommendation: string };
    expect(["LOCK_NOW", "WAIT"]).toContain(body.recommendation);
  });

  it("passes Perch penalty difference as totalInterestSavings to engine", async () => {
    // By checking the result's netBenefitNow matches what the engine would compute
    // from perchNetBenefit = totalRaw = 21_500
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    // MOCK_PENALTY_RESULT.totalRaw = 21_500 is passed as netBenefit
    const body = res.body as { netBenefitNow: number };
    expect(body.netBenefitNow).toBe(MOCK_PENALTY_RESULT.totalRaw);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// estimatePayment (tested indirectly via fetchPenaltyCost call arguments)
// ═══════════════════════════════════════════════════════════════════════

describe("estimatePayment – via analyzeFull", () => {
  it("passes a positive mortgagePayment to fetchPenaltyCost", async () => {
    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const callArgs = mockFetchPenaltyCost.mock.calls[0]![0] as Record<string, number>;
    expect(typeof callArgs["mortgagePayment"]).toBe("number");
    expect(callArgs["mortgagePayment"]).toBeGreaterThan(0);
  });

  it("estimates a higher payment for a higher interest rate", async () => {
    const lowRateReq = makeMockReq({ ...VALID_BODY, currentRate: 3.0 });
    const lowRes = makeMockRes();
    await analyzeFull(lowRateReq as Request, lowRes as unknown as Response);
    const lowPayment = (mockFetchPenaltyCost.mock.calls[0]![0] as Record<string, number>)["mortgagePayment"]!;

    jest.clearAllMocks();
    mockFetchPathfinderOffers.mockResolvedValue(MOCK_PATHFINDER_RESULT);
    mockFetchPenaltyCost.mockResolvedValue(MOCK_PENALTY_RESULT);

    const highRateReq = makeMockReq({ ...VALID_BODY, currentRate: 7.0 });
    const highRes = makeMockRes();
    await analyzeFull(highRateReq as Request, highRes as unknown as Response);
    const highPayment = (mockFetchPenaltyCost.mock.calls[0]![0] as Record<string, number>)["mortgagePayment"]!;

    expect(highPayment).toBeGreaterThan(lowPayment);
  });

  it("falls back to principal/n when rate is 0", async () => {
    const req = makeMockReq({ ...VALID_BODY, currentRate: 0 });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const callArgs = mockFetchPenaltyCost.mock.calls[0]![0] as Record<string, number>;
    const pmt = callArgs["mortgagePayment"]!;
    // When r=0: payment = principal / (25*12) = 400_000 / 300 ≈ 1333.33
    expect(pmt).toBeCloseTo(400_000 / 300, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// calculateMonthsRemaining (tested indirectly via controller behaviour)
// ═══════════════════════════════════════════════════════════════════════

describe("calculateMonthsRemaining – via analyzeFull", () => {
  it("proceeds with past maturity date (clamps to 0 months)", async () => {
    const req = makeMockReq({ ...VALID_BODY, maturityDate: "01/01/2020" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    // Should not produce a 400 or 502 — the request completes successfully
    expect(res.statusCode).toBe(200);
    expect(mockFetchPathfinderOffers).toHaveBeenCalled();
  });

  it("proceeds with an invalid date string (clamps to 0 months)", async () => {
    const req = makeMockReq({ ...VALID_BODY, maturityDate: "not-a-date" });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(200);
    expect(mockFetchPathfinderOffers).toHaveBeenCalled();
  });

  it("succeeds with a future maturity date (positive months)", async () => {
    const req = makeMockReq({ ...VALID_BODY, maturityDate: futureDate(36) });
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Error Handling – Pathfinder failure
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – Pathfinder API errors", () => {
  it("returns 502 when fetchPathfinderOffers throws an Error", async () => {
    mockFetchPathfinderOffers.mockRejectedValue(new Error("Pathfinder is down"));

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(502);
    const body = res.body as { error: string; details: string };
    expect(body.details).toBe("Pathfinder is down");
  });

  it("includes the step name ('Pathfinder') in the error field", async () => {
    mockFetchPathfinderOffers.mockRejectedValue(new Error("Connection refused"));

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const body = res.body as { error: string };
    expect(body.error).toContain("Pathfinder");
  });

  it("does not call fetchPenaltyCost when Pathfinder fails", async () => {
    mockFetchPathfinderOffers.mockRejectedValue(new Error("fail"));

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(mockFetchPenaltyCost).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Error Handling – Penalty service failure
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – Penalty API errors", () => {
  it("returns 502 when fetchPenaltyCost throws an Error", async () => {
    mockFetchPenaltyCost.mockRejectedValue(new Error("Penalty service error"));

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(502);
    const body = res.body as { details: string };
    expect(body.details).toBe("Penalty service error");
  });

  it("includes the step name ('Penalty') in the error field", async () => {
    mockFetchPenaltyCost.mockRejectedValue(new Error("Timeout"));

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    const body = res.body as { error: string };
    expect(body.error).toContain("Penalty");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Error Handling – non-Error thrown
// ═══════════════════════════════════════════════════════════════════════

describe("analyzeFull – unknown/non-Error thrown", () => {
  it("returns 502 with 'Unknown error' when a non-Error value is thrown", async () => {
    mockFetchPathfinderOffers.mockRejectedValue("string error, not Error");

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(502);
    const body = res.body as { details: string };
    expect(body.details).toBe("Unknown error");
  });

  it("returns 502 with error and details fields for any upstream failure", async () => {
    mockFetchPathfinderOffers.mockRejectedValue(null);

    const req = makeMockReq(VALID_BODY);
    const res = makeMockRes();

    await analyzeFull(req as Request, res as unknown as Response);

    expect(res.statusCode).toBe(502);
    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("details");
  });
});