/**
 * Halal Verification Logic
 * Extracted business rules for determining halal compliance status
 */

import { RiskCategory } from "@ummati/db";

export interface VerificationInput {
  industry: string;
  responses: {
    q1?: string;
    q2?: string;
    q3?: boolean;
    q4?: string;
    q5?: string;
    q6?: string;
    q7?: boolean;
    q8?: string;
    haramCategories?: string[];
  };
}

export interface VerificationResult {
  riskCategory: RiskCategory;
  halalCategory: "halal" | "grey" | "forbidden";
  halalScore: number;
  isFlagged: boolean;
  isApproved: boolean;
  rejectionReason: string | null;
}

/**
 * Determine halal verification status based on industry and questionnaire responses
 */
export function calculateHalalVerification(input: VerificationInput): VerificationResult {
  let riskCategory: RiskCategory = RiskCategory.HALAL;
  let halalCategory: "halal" | "grey" | "forbidden" = "halal";
  let isFlagged = false;
  let isApproved = false;
  let rejectionReason: string | null = null;
  let halalScore = 100;

  // Check if haram categories are selected (automatic rejection)
  if (input.responses.haramCategories && input.responses.haramCategories.length > 0) {
    riskCategory = RiskCategory.HARAM;
    halalCategory = "forbidden";
    halalScore = 0;
    rejectionReason = `Industry involves prohibited categories: ${input.responses.haramCategories.join(", ")}`;
    return {
      riskCategory,
      halalCategory,
      halalScore,
      isFlagged: false,
      isApproved: false,
      rejectionReason
    };
  }

  // Check for grey area industries
  const greyAreaKeywords = ["fintech", "crypto", "ai", "automation", "marketplace", "social"];
  const industryLower = input.industry.toLowerCase();
  const isGreyArea = greyAreaKeywords.some(keyword => industryLower.includes(keyword));

  // Check for interest/riba in responses
  const hasInterestConcerns = 
    input.responses.q4?.toLowerCase().includes("interest") ||
    input.responses.q4?.toLowerCase().includes("riba") ||
    input.responses.q5?.toLowerCase().includes("interest") ||
    input.responses.q5?.toLowerCase().includes("riba");

  // Check for high-risk indicators
  const hasRiskFactors = input.responses.q7 === true || hasInterestConcerns;

  // Determine category based on risk factors
  if (hasInterestConcerns || (input.responses.q4 && input.responses.q4.toLowerCase().includes("yes"))) {
    riskCategory = RiskCategory.HARAM;
    halalCategory = "forbidden";
    halalScore = 0;
    rejectionReason = "Industry involves interest-based revenue (Riba)";
  } else if (isGreyArea || hasRiskFactors) {
    riskCategory = RiskCategory.GREY;
    halalCategory = "grey";
    halalScore = 60;
    isFlagged = true; // Needs manual review
  } else {
    riskCategory = RiskCategory.HALAL;
    halalCategory = "halal";
    halalScore = 85;
    isApproved = true; // Auto-approve clear halal cases
  }

  return {
    riskCategory,
    halalCategory,
    halalScore,
    isFlagged,
    isApproved,
    rejectionReason
  };
}
