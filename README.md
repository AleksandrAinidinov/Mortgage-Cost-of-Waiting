# Mortgage Cost of Waiting Engine

## Problem
Homeowners considering breaking or switching their mortgage are often paralyzed by market volatility. They ask, **"Is it worth waiting for a better rate?"** but have no way to quantify the actual daily cost of that delay. 

---

## Solution
An "Industrial-Grade" decision engine built on top of Perch APIs that shifts the narrative from categorical verdicts to raw financial impact:
- **Daily Bleed**: Calculates exactly how much money is lost every single day by waiting.
- **Term-Aware Hurdle Rate**: Computes the exact future rate needed to break even, amortized accurately over the specific term of the new offer.
- **Precision Penalty Math**: Normalizes lender inputs and integrates directly with Perch's industrial penalty calculator for exact IRD (Interest Rate Differential) costs.
- **Frictionless UI**: Requires only 7 critical fields (using smart defaults for the rest) paired with a high-impact React dashboard that puts the "Daily Loss" metric front and center.

---

## Example

**Input (7 Precision Fields):**
```json
{ 
    "currentRate": 5.7,
    "remainingBalance": 400000,
    "maturityDate": "03/25/2028",
    "homeValue": 800000, 
    "waitMonths": 6,
    "lender": "TD Canada Trust",
    "mortgageRateType": "Fixed" 
}
```

**Output (Backend API):**
```json
{
    "monthlyInterestSavings": 543.33,
    "totalCostOfWaiting": 3260,
    "dailyCostOfWaiting": 18.11,
    "paybackPeriodMonths": 19.57,
    "breakEvenRate": 2.93,
    "netBenefitNow": 1275,
    "adjustedBenefit": -1985,
    "offerTermYears": 5,
    "recommendation": "LOCK_NOW",
    "summary": "TIME-TO-DECISION ANALYSIS\n\nIf you WAIT:\n• Losing $18.11/day ($543.33/month)\n\nIf you ACT:\n• Break even in 19.57 months\n• Profit after month 20\n\nVERDICT:\nLock now — delay only makes sense if rates drop below 2.93%\n\n⚠️ If you exit or refinance before 19.57 months → you lose money"
}
```

## Architecture & Integration
- **REST API**: `POST /api/v1/strategy/analyze-full`
- **External Integration (Smarter Wrapper)**:
  - **Pathfinder API**: Dynamically fetches the best current market rate and term.
  - **Penalty API**: Spoofs browser headers and normalizes lender names to retrieve exact penalties rather than default estimates.

## Stack
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, CSS (Perch UI Clone)