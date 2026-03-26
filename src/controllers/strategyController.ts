import { Request, Response } from "express";
import {
  FullAnalyzeRequest,
  FullAnalyzeResponse,
  AnalyzeRequest,
} from "../models/scenarioModel";
import { analyzeStrategy } from "../services/strategyService";
import { fetchPathfinderOffers } from "../services/pathfinderService";
import { fetchPenaltyCost } from "../services/penaltyService";

/**
 * POST /api/v1/strategy/analyze-full
 *
 * The "Smarter Wrapper": Takes 6 strategic fields and uses internal
 * "Smart Defaults" to satisfy Perch's data-hungry APIs.
 */
export const analyzeFull = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;

  // 1. Minified Validation (6 Core Fields)
  const errors = validateMinifiedRequest(body);
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  const input: FullAnalyzeRequest = {
    currentRate: Number(body.currentRate),
    remainingBalance: Number(body.remainingBalance),
    remainingTermMonths: Number(body.remainingTermMonths),
    waitMonths: Number(body.waitMonths),
    lender: String(body.lender),
    mortgageRateType: body.mortgageRateType as "Fixed" | "Variable",
  };

  let currentStep = "initializing";
  try {
    // 2. Smart Defaults Logic
    const homeValue = input.remainingBalance / 0.8; // Assume 80% LTV
    const maturityDate = calculateMaturityDate(input.remainingTermMonths);
    const estimatedPmt = estimatePayment(input.remainingBalance, input.currentRate);

    // ── Step A: Fetch best rate from Pathfinder ───────────────────────
    currentStep = "Pathfinder API (Rates)";
    const pathfinderResult = await fetchPathfinderOffers({
      city: "Toronto",      // DEFAULT
      province: "ON",       // DEFAULT
      homeValue: homeValue,
      mortgagePrincipal: input.remainingBalance,
      currentRate: input.currentRate,
      currentLender: input.lender,
      hasDefaultInsurance: false, // DEFAULT
      isOwnerOccupied: true,      // DEFAULT
    });

    const { bestOffer } = pathfinderResult;

    // ── Step B: Fetch penalty from Perch ──────────────────────────────
    currentStep = "Penalty API (Costs)";
    const penaltyResult = await fetchPenaltyCost({
      lender: input.lender,
      mortgagePrincipal: input.remainingBalance,
      mortgageRate: input.currentRate,
      mortgageRateType: input.mortgageRateType,
      originalTermYears: 5,        // DEFAULT
      maturityDate: maturityDate,
      paymentFrequency: "Monthly", // DEFAULT
      mortgagePayment: estimatedPmt,
      newMortgageRate: bestOffer.netRate,
      newMortgageRateType: "Fixed",
    });

    // ── Step C: Run the Decision Engine ───────────────────────────────
    currentStep = "Decision Engine";
    const engineInput: AnalyzeRequest = {
      currentRate: input.currentRate,
      remainingBalance: input.remainingBalance,
      remainingTermMonths: input.remainingTermMonths,
      bestOfferRate: bestOffer.netRate,
      offerTermYears: bestOffer.termYears,
      penaltyCost: penaltyResult.totalPenalty,
      waitMonths: input.waitMonths,
      totalInterestSavings: penaltyResult.difference,
      netBenefit: penaltyResult.totalRaw,
    };

    const analysis = analyzeStrategy(engineInput);

    // 3. Perfected Narrative Response
    const fullResponse: FullAnalyzeResponse = {
      ...analysis,
      pathfinder: {
        bestOffer: {
          lender: bestOffer.lender,
          netRate: bestOffer.netRate,
          termYears: bestOffer.termYears,
        },
        totalOffersFound: pathfinderResult.offers.length,
      },
      penalty: {
        totalPenalty: penaltyResult.totalPenalty,
        oldInterest: penaltyResult.oldInterest,
        newInterest: penaltyResult.newInterest,
        difference: penaltyResult.difference,
        totalRaw: penaltyResult.totalRaw,
      },
    };

    res.json(fullResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: `Failed during ${currentStep}`, details: message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// Smart Default Utilities
// ═══════════════════════════════════════════════════════════════════════

function calculateMaturityDate(monthsRemaining: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsRemaining);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function estimatePayment(principal: number, rate: number): number {
  const r = rate / 100 / 12;
  const n = 25 * 12; // Standard 25yr Amortization
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function validateMinifiedRequest(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const required = ["currentRate", "remainingBalance", "remainingTermMonths", "waitMonths", "lender", "mortgageRateType"];

  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`${field} is required.`);
    }
  }

  if (errors.length === 0) {
    if (typeof body.currentRate !== "number") errors.push("currentRate must be a number.");
    if (typeof body.remainingBalance !== "number") errors.push("remainingBalance must be a number.");
    if (typeof body.remainingTermMonths !== "number") errors.push("remainingTermMonths must be a number.");
    if (body.mortgageRateType !== "Fixed" && body.mortgageRateType !== "Variable") {
      errors.push("mortgageRateType must be 'Fixed' or 'Variable'.");
    }
  }

  return errors;
}