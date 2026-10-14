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
 * Deterministically computes the priority score, tier, and full explanatory factors.
 * @param {Object} params
 * @param {string} params.category
 * @param {string} params.safetyRiskId
 * @param {string} params.urgencyId
 * @param {string} params.communityImpactId
 * @returns {Object} Full explainable evaluation
 */
export function calculatePriority({
  category = 'Other',
  safetyRiskId = 'minor',
  urgencyId = 'routine',
  communityImpactId = 'isolated',
}) {
  const safetyOpt = SAFETY_RISK_OPTIONS.find((o) => o.id === safetyRiskId) || SAFETY_RISK_OPTIONS[0];
  const urgencyOpt = URGENCY_OPTIONS.find((o) => o.id === urgencyId) || URGENCY_OPTIONS[0];
  const impactOpt = COMMUNITY_IMPACT_OPTIONS.find((o) => o.id === communityImpactId) || COMMUNITY_IMPACT_OPTIONS[0];
  const categoryBase = CATEGORY_BASELINES[category] ?? 5;

  const rawScore = safetyOpt.score + urgencyOpt.score + impactOpt.score + categoryBase;
  const score = Math.min(100, Math.max(10, rawScore));

  let tier = PRIORITY_TIERS.LOW;
  if (score >= PRIORITY_TIERS.CRITICAL.minScore) {
    tier = PRIORITY_TIERS.CRITICAL;
  } else if (score >= PRIORITY_TIERS.HIGH.minScore) {
    tier = PRIORITY_TIERS.HIGH;
  } else if (score >= PRIORITY_TIERS.MEDIUM.minScore) {
    tier = PRIORITY_TIERS.MEDIUM;
  }

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
      value: impactOpt.label,
      score: impactOpt.score,
      max: impactOpt.maxScore,
      percentage: Math.round((impactOpt.score / impactOpt.maxScore) * 100),
      explanation: impactOpt.description,
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
  if (impactOpt.score >= 15) {
    rationaleParts.push(`high pedestrian or public corridor exposure (${impactOpt.label})`);
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
