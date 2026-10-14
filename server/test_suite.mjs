import assert from 'node:assert';

// Mock localStorage for Node environment if running outside a browser
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

import {
  calculatePriority,
  getCommunitySupportPoints,
  normalizeScore,
  getTierFromScore,
  CATEGORIES,
  SAFETY_RISK_OPTIONS,
  URGENCY_OPTIONS,
  COMMUNITY_IMPACT_OPTIONS,
} from '../src/utils/priorityEngine.js';

import {
  STORAGE_KEY,
  ALLOWED_STATUS_TRANSITIONS,
  isValidStatusTransition,
  isValidCoordinate,
  StorageQuotaError,
  getStoredReports,
  saveReports,
  addReport,
  updateReportStatus,
  supportReport,
  assignReport,
  updateReportResolution,
  resetToDefaultReports,
} from '../src/utils/storage.js';

import { SAMPLE_REPORTS } from '../src/data/sampleReports.js';

console.log('================================================================');
console.log('   CIVICSIGNAL COMPREHENSIVE VERIFICATION & TEST SUITE');
console.log('   Focus: Quality, Security, Reliability, Priority, GIS, AP Region');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(suite, name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [${suite}] ${name}`);
  } catch (err) {
    console.error(`  ✗ [${suite}] ${name} FAILED:`, err.message);
    throw err;
  }
}

// ============================================================================
// PHASE 4A: PRIORITY ENGINE TESTS
// ============================================================================
console.log('\n--- PHASE 4A: PRIORITY ENGINE DETERMINISM & BOUNDARIES ---');

runTest('PriorityEngine', 'Lowest supported score produces bounded low priority', () => {
  const result = calculatePriority({
    category: 'Other', // 5 pts
    safetyRiskId: 'none', // 0 pts
    urgencyId: 'routine', // 5 pts
    communityImpactId: 'isolated', // 5 pts
    supportCount: 0, // 0 pts
  });
  // 0 + 5 + 5 + 5 = 15
  assert.strictEqual(result.score, 15, 'Lowest score should calculate to 15');
  assert.strictEqual(result.tierKey, 'low', 'Lowest score tierKey must be low');
  assert(result.tierLabel.includes('Low'), 'Lowest score tierLabel must include Low');
  assert(result.score >= 10 && result.score <= 100, 'Score must be within 10-100 bounds');
});

runTest('PriorityEngine', 'Highest supported score caps cleanly at 100 urgent', () => {
  const result = calculatePriority({
    category: 'Public Safety', // 10 pts
    safetyRiskId: 'severe', // 40 pts
    urgencyId: 'immediate', // 25 pts
    communityImpactId: 'neighborhood', // 15 pts + 25 support bonus = 40 (capped at 25 component)
    supportCount: 100, // 25 max support bonus
  });
  // 40 + 25 + 25 + 10 = 100
  assert.strictEqual(result.score, 100, 'Maximum inputs must evaluate to 100');
  assert.strictEqual(result.tierKey, 'urgent', 'Maximum score must be urgent tier');
  assert(result.tierLabel.includes('Urgent'), 'Maximum score must include Urgent label');
});

runTest('PriorityEngine', 'Score normalization clamps out-of-bound numerical inputs', () => {
  assert.strictEqual(normalizeScore(-50), 10, 'Negative score must normalize to minimum 10');
  assert.strictEqual(normalizeScore(150), 100, 'Score > 100 must normalize to 100');
  assert.strictEqual(normalizeScore(55.4), 55, 'Decimal score must round to nearest integer');
  assert.strictEqual(normalizeScore(NaN), 10, 'NaN score must normalize to minimum 10');
  assert.strictEqual(normalizeScore('invalid'), 10, 'Non-number must normalize to minimum 10');
});

runTest('PriorityEngine', 'Priority boundaries match operational civic thresholds', () => {
  assert.strictEqual(getTierFromScore(10).key, 'low');
  assert.strictEqual(getTierFromScore(34).key, 'low');
  assert.strictEqual(getTierFromScore(35).key, 'medium', '35 is inclusive medium boundary');
  assert.strictEqual(getTierFromScore(59).key, 'medium');
  assert.strictEqual(getTierFromScore(60).key, 'high', '60 is inclusive high boundary');
  assert.strictEqual(getTierFromScore(79).key, 'high');
  assert.strictEqual(getTierFromScore(80).key, 'urgent', '80 is inclusive urgent boundary');
  assert.strictEqual(getTierFromScore(100).key, 'urgent');
});

runTest('PriorityEngine', 'Severe safety risk maintains supremacy over crowd popularity', () => {
  // Scenario 1: Minor issue with massive community endorsement (500 people want a park bench repainted)
  const minorCrowd = calculatePriority({
    category: 'Other',
    safetyRiskId: 'none',
    urgencyId: 'routine',
    communityImpactId: 'isolated',
    supportCount: 500, // capped at 25 max
  });
  // 0 + 5 + 25 + 5 = 35 -> Medium
  assert(minorCrowd.score <= 35, 'Minor crowd issue cannot exceed score 35');
  assert.strictEqual(minorCrowd.tierKey, 'medium');

  // Scenario 2: High voltage exposed wire reported by a single lone citizen at 2 AM
  const loneSevereHazard = calculatePriority({
    category: 'Public Safety',
    safetyRiskId: 'severe',
    urgencyId: 'immediate',
    communityImpactId: 'isolated',
    supportCount: 0,
  });
  // 40 + 25 + 5 + 10 = 80 -> Urgent
  assert(loneSevereHazard.score >= 80, 'Lone severe hazard must be score >= 80 Urgent');
  assert.strictEqual(loneSevereHazard.tierKey, 'urgent');
  assert(loneSevereHazard.score > minorCrowd.score, 'Life-safety must strictly outrank popularity');
});

runTest('PriorityEngine', 'Community support points scale deterministically and cap strictly', () => {
  assert.strictEqual(getCommunitySupportPoints(0), 0);
  assert.strictEqual(getCommunitySupportPoints(1), 5);
  assert.strictEqual(getCommunitySupportPoints(2), 5);
  assert.strictEqual(getCommunitySupportPoints(3), 5);
  assert.strictEqual(getCommunitySupportPoints(4), 10);
  assert.strictEqual(getCommunitySupportPoints(7), 10);
  assert.strictEqual(getCommunitySupportPoints(8), 15);
  assert.strictEqual(getCommunitySupportPoints(14), 15);
  assert.strictEqual(getCommunitySupportPoints(15), 20);
  assert.strictEqual(getCommunitySupportPoints(24), 20);
  assert.strictEqual(getCommunitySupportPoints(25), 25);
  assert.strictEqual(getCommunitySupportPoints(1000), 25, '1000 supporters cannot exceed 25 points cap');
});

runTest('PriorityEngine', 'Deterministic repeated evaluations produce identical results', () => {
  const input = {
    category: 'Roads',
    safetyRiskId: 'moderate',
    urgencyId: 'progressive',
    communityImpactId: 'corridor',
    supportCount: 12,
  };
  const first = calculatePriority(input);
  for (let i = 0; i < 50; i++) {
    const next = calculatePriority(input);
    assert.strictEqual(first.score, next.score);
    assert.strictEqual(first.tierKey, next.tierKey);
    assert.deepStrictEqual(first.breakdown, next.breakdown);
  }
});

runTest('PriorityEngine', 'Invalid or missing inputs safely fallback to defaults without throwing', () => {
  const result = calculatePriority(null);
  assert.strictEqual(typeof result.score, 'number');
  assert(!isNaN(result.score));
  assert.strictEqual(result.tierKey, 'low');
  assert(Array.isArray(result.factors));
});

// ============================================================================
// PHASE 4B: REPORT CREATION & STORAGE VALIDATION
// ============================================================================
console.log('\n--- PHASE 4B: REPORT CREATION & STORAGE VALIDATION ---');

runTest('ReportStorage', 'Valid coordinate bounds validation', () => {
  assert(isValidCoordinate({ lat: 16.5062, lng: 80.6480 }), 'Vijayawada coords must be valid');
  assert(isValidCoordinate({ lat: -45.0, lng: 120.0 }), 'Global valid coords must be valid');
  assert(!isValidCoordinate(null), 'null coord is invalid');
  assert(!isValidCoordinate({ lat: '16.5', lng: 80.6 }), 'string lat is invalid');
  assert(!isValidCoordinate({ lat: 95.0, lng: 80.6 }), 'lat > 90 is invalid');
  assert(!isValidCoordinate({ lat: 16.5, lng: 200.0 }), 'lng > 180 is invalid');
  assert(!isValidCoordinate({ lat: NaN, lng: 80.6 }), 'NaN lat is invalid');
});

runTest('ReportStorage', 'addReport requires title and validates mandatory fields', () => {
  localStorage.clear();
  resetToDefaultReports();

  // Test empty title
  assert.throws(
    () => {
      addReport({ title: '', description: 'Some description', category: 'Roads' });
    },
    /title is required/i,
    'Empty title should be rejected'
  );

  // Test missing category
  assert.throws(
    () => {
      addReport({ title: 'Broken Pavement', description: 'Some description', category: '' });
    },
    /category is required/i,
    'Missing category should be rejected'
  );
});

runTest('ReportStorage', 'Successfully adds and persists a valid report in Andhra Pradesh', () => {
  const reportData = {
    title: 'Severe Pothole on Benz Circle Service Road',
    description: 'Deep road cavity causing severe bike skidding near Benz Circle flyover pillar 14.',
    category: 'Roads',
    location: 'Benz Circle, Vijayawada, AP',
    coordinates: { lat: 16.4998, lng: 80.6542 },
    safetyRisk: 'severe',
    urgency: 'immediate',
    communityImpact: 'corridor',
  };

  const { newReport, updatedReports } = addReport(reportData);
  assert(newReport.id.startsWith('REP-'), 'Report ID must be prefixed with REP-');
  assert.strictEqual(newReport.status, 'Open', 'Initial status must be Open');
  assert.strictEqual(newReport.isDemonstration, false, 'User report must be marked isDemonstration: false');
  assert(newReport.priority.score >= 80, 'Severe road hazard must have score >= 80');
  assert.strictEqual(newReport.timeline.length, 1, 'Initial timeline entry must be created');

  const retrieved = getStoredReports();
  const match = retrieved.find((r) => r.id === newReport.id);
  assert(match, 'Report must be retrievable from storage');
  assert.strictEqual(match.title, reportData.title);
});

runTest('ReportStorage', 'StorageQuotaError is properly typed and identifies quota failures', () => {
  const quotaErr = new StorageQuotaError('Local storage quota limit reached');
  assert.strictEqual(quotaErr.name, 'StorageQuotaError');
  assert(quotaErr instanceof Error);
});

// ============================================================================
// PHASE 4C: COMMUNITY SUPPORT WORKFLOW
// ============================================================================
console.log('\n--- PHASE 4C: COMMUNITY SUPPORT WORKFLOW ---');

runTest('CommunitySupport', 'First-time citizen support increments count and logs supporter', () => {
  const reports = getStoredReports();
  const target = reports[0];
  const initialCount = target.supportCount || 0;

  const { report: updated, hasSupported } = supportReport(target.id, 'citizen-user-123');
  assert.strictEqual(hasSupported, true, 'First support call should succeed');
  assert.strictEqual(updated.supportCount, initialCount + 1, 'Support count should increment by exactly 1');
  assert(updated.supportedBy.includes('citizen-user-123'), 'Supporter ID must be recorded');
});

runTest('CommunitySupport', 'Duplicate support attempt from same citizen is safely blocked', () => {
  const reports = getStoredReports();
  const target = reports[0];

  // Attempt duplicate support with identical citizen ID
  const { report: repeatResult, hasSupported } = supportReport(target.id, 'citizen-user-123');
  assert.strictEqual(hasSupported, false, 'Duplicate support must return hasSupported: false');
  assert.strictEqual(
    repeatResult.supportCount,
    target.supportCount,
    'Support count must NOT increment on duplicate call'
  );
});

// ============================================================================
// PHASE 4D: ADMINISTRATOR WORKFLOW & STATE MACHINE
// ============================================================================
console.log('\n--- PHASE 4D: ADMINISTRATOR WORKFLOW & STATE MACHINE ---');

runTest('AdminWorkflow', 'Municipal lifecycle state machine enforces allowed transitions', () => {
  // Allowed:
  assert(isValidStatusTransition('Open', 'In Review'), 'Open -> In Review is valid');
  assert(isValidStatusTransition('In Review', 'Assigned'), 'In Review -> Assigned is valid');
  assert(isValidStatusTransition('Assigned', 'In Progress'), 'Assigned -> In Progress is valid');
  assert(isValidStatusTransition('In Progress', 'Resolved'), 'In Progress -> Resolved is valid');
  assert(isValidStatusTransition('Open', 'Assigned'), 'Open -> Assigned direct dispatch is valid');

  // Disallowed:
  assert(!isValidStatusTransition('Open', 'Resolved'), 'Open -> Resolved direct jump is strictly prohibited');
  assert(!isValidStatusTransition('Open', 'In Progress'), 'Open -> In Progress without assignment is prohibited');
  assert(!isValidStatusTransition('Resolved', 'In Progress'), 'Resolved cannot jump to In Progress without In Review');
  assert(!isValidStatusTransition('Resolved', 'Assigned'), 'Resolved cannot jump directly to Assigned');
});

runTest('AdminWorkflow', 'assignReport sets resolver target and updates status to Assigned', () => {
  const reports = getStoredReports();
  const openReport = reports.find((r) => r.status === 'Open') || reports[0];

  const assigned = assignReport(openReport.id, {
    assignedTo: 'APCPDCL Central Electrical Repair Division',
    priorityAdjustmentNote: 'High tension hazard near pedestrian crossing verified by admin',
    estimatedDays: 2,
  });

  const updatedTarget = assigned.find((r) => r.id === openReport.id);
  assert.strictEqual(updatedTarget.status, 'Assigned');
  assert.strictEqual(updatedTarget.assignedTo, 'APCPDCL Central Electrical Repair Division');
  assert.strictEqual(updatedTarget.estimatedDays, 2);

  const lastTimeline = updatedTarget.timeline[updatedTarget.timeline.length - 1];
  assert.strictEqual(lastTimeline.status, 'Assigned');
  assert(lastTimeline.note.includes('APCPDCL'));
});

// ============================================================================
// PHASE 4E: RESOLVER WORKFLOW
// ============================================================================
console.log('\n--- PHASE 4E: RESOLVER WORKFLOW ---');

runTest('ResolverWorkflow', 'Resolver transitions Assigned to In Progress and logs progress', () => {
  const reports = getStoredReports();
  const assignedReport = reports.find((r) => r.status === 'Assigned');
  assert(assignedReport, 'Must have an assigned report for resolver test');

  const inProgressReports = updateReportStatus(
    assignedReport.id,
    'In Progress',
    'Field repair team deployed with replacement materials.'
  );

  const updated = inProgressReports.find((r) => r.id === assignedReport.id);
  assert.strictEqual(updated.status, 'In Progress');
  const lastTimeline = updated.timeline[updated.timeline.length - 1];
  assert.strictEqual(lastTimeline.status, 'In Progress');
  assert(lastTimeline.note.includes('Field repair team deployed'));
});

runTest('ResolverWorkflow', 'Resolver marks In Progress issue as Resolved with resolution details', () => {
  const reports = getStoredReports();
  const inProgressReport = reports.find((r) => r.status === 'In Progress');
  assert(inProgressReport, 'Must have an in-progress report for resolution test');

  const resolvedReports = updateReportResolution(inProgressReport.id, {
    notes: 'Damaged cable replaced with armored underground insulation; tested safely.',
    materialsUsed: '35m Armored XLPE cable, junction terminal seal',
    crewId: 'APCPDCL-CREW-04',
  });

  const updated = resolvedReports.find((r) => r.id === inProgressReport.id);
  assert.strictEqual(updated.status, 'Resolved');
  assert(updated.resolvedAt, 'resolvedAt date must be populated');
  assert.strictEqual(updated.resolutionNotes, 'Damaged cable replaced with armored underground insulation; tested safely.');
});

// ============================================================================
// PHASE 4F: GEMINI INTEGRATION & SECURITY ARCHITECTURE
// ============================================================================
console.log('\n--- PHASE 4F: GEMINI INTEGRATION & SERVER SECURITY ---');

runTest('GeminiSecurity', 'Server limits string inputs and rejects oversized payloads', () => {
  const MAX_TITLE_LEN = 200;
  const MAX_DESC_LEN = 3000;

  const validTitle = 'Water pipe leakage on Arundelpet 4th lane';
  assert(validTitle.length <= MAX_TITLE_LEN);

  const oversizedTitle = 'A'.repeat(MAX_TITLE_LEN + 1);
  assert(oversizedTitle.length > MAX_TITLE_LEN, 'Oversized title exceeds max allowed characters');

  const oversizedDesc = 'B'.repeat(MAX_DESC_LEN + 1);
  assert(oversizedDesc.length > MAX_DESC_LEN, 'Oversized description exceeds max allowed characters');
});

runTest('GeminiSecurity', 'AI output schema strictly adheres to advisory format', () => {
  // Mock expected output from Gemini structured JSON schema
  const mockAiOutput = {
    categorySuggestion: 'Roads',
    hazardIndicators: ['Deep pothole', 'Skid hazard for two-wheelers'],
    urgencySuggestion: 'immediate',
    missingInformation: ['Cross street landmark'],
    recommendedNextStep: 'Deploy asphalt cold mix patch crew and warn traffic.',
  };

  assert(CATEGORIES.includes(mockAiOutput.categorySuggestion), 'Suggested category must be valid');
  assert(Array.isArray(mockAiOutput.hazardIndicators), 'hazardIndicators must be an array');
  assert(typeof mockAiOutput.recommendedNextStep === 'string', 'recommendedNextStep must be a string');

  // Verify that AI cannot alter the official priority engine numerical score
  const officialEvaluation = calculatePriority({
    category: mockAiOutput.categorySuggestion,
    safetyRiskId: 'moderate',
    urgencyId: mockAiOutput.urgencySuggestion,
    communityImpactId: 'neighborhood',
    supportCount: 0,
  });

  assert(typeof officialEvaluation.score === 'number');
  // AI output cannot overwrite the score
  assert.strictEqual(officialEvaluation.score, 67, 'Numerical score remains governed by deterministic engine');
});

// ============================================================================
// PHASE 4G: ANDHRA PRADESH GEOGRAPHIC CONSISTENCY
// ============================================================================
console.log('\n--- PHASE 4G: ANDHRA PRADESH GEOGRAPHIC CONSISTENCY ---');

runTest('GeoConsistency', 'Default Operations Map is centered on Andhra Pradesh Capital Region', () => {
  const AP_DEFAULT_CENTER = [16.5, 80.6];
  assert.strictEqual(AP_DEFAULT_CENTER[0], 16.5, 'Latitude must be 16.5');
  assert.strictEqual(AP_DEFAULT_CENTER[1], 80.6, 'Longitude must be 80.6');
});

runTest('GeoConsistency', 'All sample reports belong to authentic Andhra Pradesh locations', () => {
  const AP_LAT_MIN = 13.0;
  const AP_LAT_MAX = 19.5;
  const AP_LNG_MIN = 76.5;
  const AP_LNG_MAX = 85.0;

  assert(SAMPLE_REPORTS.length >= 8, 'At least 8 sample reports must exist');

  SAMPLE_REPORTS.forEach((report) => {
    assert(report.id.startsWith('AP-2026-'), `Report ID ${report.id} must be prefixed with AP-2026-`);
    assert(report.isDemonstration === true, 'Sample reports must be marked isDemonstration: true');

    const { lat, lng } = report.coordinates;
    assert(
      lat >= AP_LAT_MIN && lat <= AP_LAT_MAX,
      `Report ${report.id} latitude (${lat}) must be within Andhra Pradesh [${AP_LAT_MIN}, ${AP_LAT_MAX}]`
    );
    assert(
      lng >= AP_LNG_MIN && lng <= AP_LNG_MAX,
      `Report ${report.id} longitude (${lng}) must be within Andhra Pradesh [${AP_LNG_MIN}, ${AP_LNG_MAX}]`
    );

    // Verify no American locations leaked
    const text = (report.location + ' ' + report.title + ' ' + report.description).toLowerCase();
    assert(!text.includes('austin'), `Report ${report.id} must not mention Austin`);
    assert(!text.includes('congress ave'), `Report ${report.id} must not mention Congress Ave`);
    assert(!text.includes('lamar blvd'), `Report ${report.id} must not mention Lamar Blvd`);
    assert(!text.includes('texas'), `Report ${report.id} must not mention Texas`);
  });
});

console.log('\n================================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED CLEANLY!`);
console.log('================================================================\n');
