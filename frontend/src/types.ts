export interface AnalysisResult {
  monthlyInterestSavings: number;
  totalCostOfWaiting: number;
  dailyCostOfWaiting: number;
  paybackPeriodMonths: number;
  breakEvenRate: number;
  netBenefitNow: number;
  adjustedBenefit: number;
  offerTermYears: number;
  recommendation: "LOCK_NOW" | "WAIT";
  summary: string;
}

export interface FormData {
  currentRate: number;
  remainingBalance: number;
  maturityDate: string;
  homeValue: number;
  waitMonths: number;
  lender: string;
  mortgageRateType: "Fixed" | "Variable";
}
