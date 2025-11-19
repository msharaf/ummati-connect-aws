/**
 * HalalFocus System - Halal Verification and Scoring
 * 
 * Calculates halalScore (0-100) and halalCategory (halal/grey/forbidden)
 * based on questionnaire responses about business activities.
 */

export interface HalalFocusResponse {
  // Industry classification
  industryInvolvesInterest?: boolean; // Riba/Interest
  industryInvolvesGambling?: boolean;
  industryInvolvesAdultContent?: boolean;
  industryInvolvesIntoxicants?: boolean;
  industryInvolvesNonHalalProducts?: boolean;
  industryInvolvesHighRiskBehaviors?: boolean;
  industryInvolvesDeceptivePractices?: boolean;
  
  // Additional context (optional)
  additionalNotes?: string;
}

export type HalalCategory = "halal" | "grey" | "forbidden";

export interface HalalFocusResult {
  halalScore: number; // 0-100
  halalCategory: HalalCategory;
  rejectionReason?: string;
}

/**
 * Calculate HalalFocus score and category based on questionnaire responses
 */
export function calculateHalalFocus(responses: HalalFocusResponse): HalalFocusResult {
  // Start with perfect score
  let score = 100;
  let hasForbidden = false;
  let hasGrey = false;
  const issues: string[] = [];

  // Check for forbidden activities (automatic rejection)
  if (responses.industryInvolvesInterest) {
    hasForbidden = true;
    issues.push("Involves interest/Riba");
  }
  if (responses.industryInvolvesGambling) {
    hasForbidden = true;
    issues.push("Involves gambling");
  }
  if (responses.industryInvolvesAdultContent) {
    hasForbidden = true;
    issues.push("Involves adult content");
  }
  if (responses.industryInvolvesIntoxicants) {
    hasForbidden = true;
    issues.push("Involves intoxicants");
  }

  // If forbidden activities detected, automatic rejection
  if (hasForbidden) {
    return {
      halalScore: 0,
      halalCategory: "forbidden",
      rejectionReason: `Forbidden activities detected: ${issues.join(", ")}`
    };
  }

  // Check for grey area activities (reduces score but allowed)
  if (responses.industryInvolvesNonHalalProducts) {
    score -= 30;
    hasGrey = true;
    issues.push("Non-halal products");
  }
  if (responses.industryInvolvesHighRiskBehaviors) {
    score -= 25;
    hasGrey = true;
    issues.push("High-risk behaviors");
  }
  if (responses.industryInvolvesDeceptivePractices) {
    score -= 40;
    hasGrey = true;
    issues.push("Deceptive or unethical practices");
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine category
  let category: HalalCategory;
  if (score >= 70 && !hasGrey) {
    category = "halal";
  } else if (score >= 40 || hasGrey) {
    category = "grey";
  } else {
    category = "forbidden";
    return {
      halalScore: score,
      halalCategory: "forbidden",
      rejectionReason: `Low compliance score: ${issues.join(", ")}`
    };
  }

  return {
    halalScore: score,
    halalCategory: category
  };
}

/**
 * Validate that a category is allowed for matching
 * Only "halal" and "grey" are allowed, "forbidden" is rejected
 */
export function isCategoryAllowed(category: HalalCategory | null | undefined): boolean {
  if (!category) return false;
  return category === "halal" || category === "grey";
}

/**
 * Get questionnaire schema for frontend forms
 */
export function getHalalFocusQuestionnaire() {
  return {
    questions: [
      {
        id: "industryInvolvesInterest",
        label: "Does your business involve interest/Riba?",
        type: "boolean",
        forbidden: true
      },
      {
        id: "industryInvolvesGambling",
        label: "Does your business involve gambling?",
        type: "boolean",
        forbidden: true
      },
      {
        id: "industryInvolvesAdultContent",
        label: "Does your business involve adult content?",
        type: "boolean",
        forbidden: true
      },
      {
        id: "industryInvolvesIntoxicants",
        label: "Does your business involve intoxicants (alcohol, etc.)?",
        type: "boolean",
        forbidden: true
      },
      {
        id: "industryInvolvesNonHalalProducts",
        label: "Does your business involve non-halal products?",
        type: "boolean",
        grey: true
      },
      {
        id: "industryInvolvesHighRiskBehaviors",
        label: "Does your business involve high-risk behaviors?",
        type: "boolean",
        grey: true
      },
      {
        id: "industryInvolvesDeceptivePractices",
        label: "Does your business involve deceptive or unethical practices?",
        type: "boolean",
        grey: true
      }
    ]
  };
}

