/**
 * CivicSignal Deterministic Explainable Priority Engine
 *
 * Provides transparent, client-side, explainable triage scoring for community issues.
 * All factors are explicitly defined and mathematically inspectable.
 */

export const CATEGORIES = [
  'Roads',
  'Waste Management',
  'Public Safety',
  'Accessibility',
  'Environment',
  'Public Services',
  'Other',
];

export const CATEGORY_BASELINES = {
  'Public Safety': 10,
  'Accessibility': 10,
  'Roads': 7,
  'Environment': 7,
  'Waste Management': 6,
  'Public Services': 6,
  'Other': 5,
};

export const SAFETY_RISK_OPTIONS = [
  {
    id: 'none',
    label: 'None / Minimal Hazard',
    score: 0,
    maxScore: 40,
    description: 'No imminent threat to physical well-being or safety.',
  },
  {
    id: 'minor',
    label: 'Low / Property Hazard',
    score: 12,
    maxScore: 40,
    description: 'Potential for minor property scuffs or localized non-hazardous disruption.',
  },
  {
    id: 'moderate',
    label: 'Moderate / Pedestrian or Cyclist Hazard',
    score: 25,
    maxScore: 40,
    description: 'Direct trip hazard, cycling obstruction, or traffic distraction.',
  },
  {
    id: 'severe',
    label: 'Severe / Immediate Bodily Hazard',
    score: 40,
    maxScore: 40,
    description: 'Severe risk of injury, electrocution, falling structural debris, or high-speed collision.',
  },
];

export const URGENCY_OPTIONS = [
  {
    id: 'routine',
    label: 'Routine / Stable',
    score: 5,
    maxScore: 25,
    description: 'Issue is stationary and will not degrade noticeably in the near term.',
  },
  {
    id: 'progressive',
    label: 'Progressive / Escalating',
    score: 15,
    maxScore: 25,
    description: 'Wear or obstruction is worsening with daily weather or vehicle passes.',
  },
  {
    id: 'immediate',
    label: 'Immediate / Acute Exposure',
    score: 25,
    maxScore: 25,
    description: 'Active flooding, impending storm vulnerability, or peak pedestrian rush-hour conflict.',
  },
];

export const COMMUNITY_IMPACT_OPTIONS = [
  {
    id: 'isolated',
    label: 'Isolated / Low Density',
    score: 5,
    maxScore: 25,
    description: 'Quiet cul-de-sac, secluded alley, or limited pedestrian usage.',
  },
  {
    id: 'neighborhood',
    label: 'Neighborhood Corridor',
    score: 15,
    maxScore: 25,
    description: 'Active residential street, neighborhood park, or local commercial shops.',
  },
  {
    id: 'vital',
    label: 'High Vulnerability / Arterial Hub',
    score: 25,
    maxScore: 25,
    description: 'School walking zone, elderly care facility route, major transit stop, or primary arterial.',
  },
];

export const PRIORITY_TIERS = {
  CRITICAL: {
    key: 'urgent',
    label: 'Urgent / Critical',
    minScore: 80,
    badgeClass: 'badge-urgent',
    description: 'Requires immediate municipal inspection and expedited safety containment.',
  },
  HIGH: {
    key: 'high',
    label: 'High Priority',
    minScore: 60,
    badgeClass: 'badge-high',
    description: 'Significant community disruption or acute pedestrian accessibility barrier.',
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium Priority',
    minScore: 35,
    badgeClass: 'badge-medium',
    description: 'Standard public works queue for scheduled inspection and routine dispatch.',
  },
  LOW: {
    key: 'low',
    label: 'Low Priority',
    minScore: 0,
    badgeClass: 'badge-low',
    description: 'Non-hazardous or aesthetic issue scheduled during regular neighborhood maintenance.',
  },
};

/**
 * Maps unique citizen supporters to bounded community impact points.
 * Explicitly bounded at 25 points maximum so popularity can never
 * override physical safety risks.
 *
 * - 0 supporters: 0 pts
 * - 1–2 supporters: 5 pts
 * - 3–5 supporters: 10 pts
 * - 6–10 supporters: 15 pts
 * - 11–20 supporters: 20 pts
 * - 21+ supporters: 25 pts
 *
 * @param {number} count Number of unique citizen endorsements
 * @returns {number} Points (0-25)
 */
export function getCommunitySupportPoints(count = 0) {
  const n = Math.max(0, parseInt(count, 10) || 0);
  if (n >= 21) return 25;
  if (n >= 11) return 20;
  if (n >= 6) return 15;
  if (n >= 3) return 10;
  if (n >= 1) return 5;
  return 0;
}

/**
 * Normalizes a numerical score into bounded integer range [10, 100].
 * @param {any} score
 * @returns {number}
 */
export function normalizeScore(score) {
  const n = typeof score === 'number' && !isNaN(score) ? Math.round(score) : 10;
  return Math.min(100, Math.max(10, n));
}

/**
 * Returns the operational priority tier object corresponding to a given score.
 * @param {number} score
 * @returns {Object} Tier definition
 */
export function getTierFromScore(score) {
  const normalized = normalizeScore(score);
  if (normalized >= PRIORITY_TIERS.CRITICAL.minScore) {
    return PRIORITY_TIERS.CRITICAL;
  } else if (normalized >= PRIORITY_TIERS.HIGH.minScore) {
    return PRIORITY_TIERS.HIGH;
  } else if (normalized >= PRIORITY_TIERS.MEDIUM.minScore) {
    return PRIORITY_TIERS.MEDIUM;
  }
  return PRIORITY_TIERS.LOW;
}

/**
 * Deterministically computes the priority score, tier, and full explanatory factors.
 * Incorporates bounded community support without double-counting impact.
 *
 * @param {Object} params
 * @param {string} params.category
 * @param {string} params.safetyRiskId
 * @param {string} params.urgencyId
 * @param {string} params.communityImpactId
 * @param {number} [params.supportCount=0]
 * @returns {Object} Full explainable evaluation
 */
export function calculatePriority({
  category = 'Other',
  safetyRiskId = 'minor',
  urgencyId = 'routine',
  communityImpactId = 'isolated',
  supportCount = 0,
}) {
  const safetyOpt = SAFETY_RISK_OPTIONS.find((o) => o.id === safetyRiskId) || SAFETY_RISK_OPTIONS[0];
  const urgencyOpt = URGENCY_OPTIONS.find((o) => o.id === urgencyId) || URGENCY_OPTIONS[0];
  const impactOpt = COMMUNITY_IMPACT_OPTIONS.find((o) => o.id === communityImpactId) || COMMUNITY_IMPACT_OPTIONS[0];
  const categoryBase = CATEGORY_BASELINES[category] ?? 5;

  // Bounded community impact calculation: blends base scope with citizen support (capped at 25)
  const supportPoints = getCommunitySupportPoints(supportCount);
  const effectiveCommunityScore = Math.min(25, Math.max(impactOpt.score, supportPoints));

  const rawScore = safetyOpt.score + urgencyOpt.score + effectiveCommunityScore + categoryBase;
  const score = normalizeScore(rawScore);
  const tier = getTierFromScore(score);

  const factors = [
    {
      key: 'safety',
      label: 'Safety Risk',
      value: safetyOpt.label,
      score: safetyOpt.score,
      max: safetyOpt.maxScore,
      percentage: Math.round((safetyOpt.score / safetyOpt.maxScore) * 100),
      explanation: safetyOpt.description,
    },
    {
      key: 'urgency',
      label: 'Urgency & Degradation',
      value: urgencyOpt.label,
      score: urgencyOpt.score,
      max: urgencyOpt.maxScore,
      percentage: Math.round((urgencyOpt.score / urgencyOpt.maxScore) * 100),
      explanation: urgencyOpt.description,
    },
    {
      key: 'community',
      label: 'Community Impact & Scope',
      value:
        supportCount > 0
          ? `${impactOpt.label} (+${supportCount} supporters)`
          : impactOpt.label,
      score: effectiveCommunityScore,
      max: 25,
      percentage: Math.round((effectiveCommunityScore / 25) * 100),
      explanation:
        supportCount > 0
          ? `${impactOpt.description} Calibrated with ${supportCount} unique citizen endorsement(s) (${supportPoints} pts).`
          : impactOpt.description,
      supportCount,
      supportPoints,
    },
    {
      key: 'category',
      label: 'Category Baseline Weight',
      value: category,
      score: categoryBase,
      max: 10,
      percentage: Math.round((categoryBase / 10) * 100),
      explanation: `Municipal baseline weighting for ${category} infrastructure.`,
    },
  ];

  // Synthesize readable plain-English rationale
  const rationaleParts = [];
  if (safetyOpt.score >= 25) {
    rationaleParts.push(`elevated physical hazard (${safetyOpt.label})`);
  }
  if (urgencyOpt.score >= 15) {
    rationaleParts.push(`escalating urgency (${urgencyOpt.label})`);
  }
  if (effectiveCommunityScore >= 15) {
    if (supportCount >= 3) {
      rationaleParts.push(`active community confirmation (${supportCount} verified citizens)`);
    } else {
      rationaleParts.push(`high pedestrian or public corridor exposure (${impactOpt.label})`);
    }
  }

  const synthesizedReason =
    rationaleParts.length > 0
      ? `Prioritized due to ${rationaleParts.join(', ')}.`
      : 'Standard baseline priority with low immediate risk factors.';

  return {
    score,
    tierKey: tier.key,
    tierLabel: tier.label,
    badgeClass: tier.badgeClass,
    tierDescription: tier.description,
    factors,
    synthesizedReason,
    disclaimer:
      'Decision-support triage estimate only. This calculated score is an algorithmic aid for transparent community prioritization, not an official government decree or emergency dispatch order.',
  };
}
