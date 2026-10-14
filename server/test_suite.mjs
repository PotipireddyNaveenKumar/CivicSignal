import assert from 'node:assert';
import { calculatePriority, getCommunitySupportPoints, CATEGORIES } from '../src/utils/priorityEngine.js';

console.log('🧪 Starting CivicSignal Verification Test Suite...\n');

// 1. Community Support Bounded Points Test
console.log('1. Testing Bounded Community Support Contribution:');
assert.strictEqual(getCommunitySupportPoints(0), 0, '0 supporters should yield 0 pts');
assert.strictEqual(getCommunitySupportPoints(1), 5, '1 supporter should yield 5 pts');
assert.strictEqual(getCommunitySupportPoints(2), 5, '2 supporters should yield 5 pts');
assert.strictEqual(getCommunitySupportPoints(4), 10, '4 supporters should yield 10 pts');
assert.strictEqual(getCommunitySupportPoints(8), 15, '8 supporters should yield 15 pts');
assert.strictEqual(getCommunitySupportPoints(15), 20, '15 supporters should yield 20 pts');
assert.strictEqual(getCommunitySupportPoints(50), 25, '50 supporters should cap at 25 pts');
console.log('   ✓ Support point bounds verified: 0, 5, 10, 15, 20, 25 (strict cap).');

// 2. Safety Risk Supremacy vs Popularity Test
console.log('\n2. Testing Safety Risk Supremacy (Popularity cannot override life-safety hazard):');
// High-popularity minor issue
const minorPopular = calculatePriority({
  category: 'Other', // 5 pts
  safetyRiskId: 'none', // 0 pts
  urgencyId: 'routine', // 5 pts
  communityImpactId: 'isolated', // 5 pts
  supportCount: 50, // yields max 25 pts
});
// Total: 0 + 5 + 25 + 5 = 35 -> Medium Priority
console.log(`   Minor issue with 50 supporters: Score = ${minorPopular.score} (${minorPopular.tierLabel})`);
assert(minorPopular.score <= 40, 'Popular minor issue should not exceed medium priority');
assert.strictEqual(minorPopular.tierKey, 'medium', 'Popular minor issue must remain Medium tier');

// Low-popularity severe hazard
const severeUnpopular = calculatePriority({
  category: 'Public Safety', // 10 pts
  safetyRiskId: 'severe', // 40 pts
  urgencyId: 'immediate', // 25 pts
  communityImpactId: 'isolated', // 5 pts
  supportCount: 0, // 0 pts
});
// Total: 40 + 25 + 5 + 10 = 80 -> Urgent/Critical
console.log(`   Severe hazard with 0 supporters: Score = ${severeUnpopular.score} (${severeUnpopular.tierLabel})`);
assert(severeUnpopular.score >= 80, 'Severe hazard with 0 supporters must still be Critical/Urgent');
assert.strictEqual(severeUnpopular.tierKey, 'urgent', 'Severe hazard must be Urgent tier');
console.log('   ✓ Safety hazard priority is strictly preserved over crowd volume.');

// 3. Category Validation Test
console.log('\n3. Testing Category Integrity:');
assert(CATEGORIES.includes('Public Safety'), 'Public Safety must exist in categories');
assert(CATEGORIES.includes('Roads'), 'Roads must exist in categories');
assert(CATEGORIES.includes('Accessibility'), 'Accessibility must exist in categories');
console.log('   ✓ Supported civic categories verified.');

// 4. Deterministic Recalculation Test
console.log('\n4. Testing Dynamic Priority Recalculation:');
const baseEval = calculatePriority({
  category: 'Roads',
  safetyRiskId: 'moderate', // 25
  urgencyId: 'progressive', // 15
  communityImpactId: 'neighborhood', // 15
  supportCount: 0,
});
// 25 + 15 + 15 + 7 = 62 (High)
assert.strictEqual(baseEval.score, 62);

const boostedEval = calculatePriority({
  category: 'Roads',
  safetyRiskId: 'moderate', // 25
  urgencyId: 'progressive', // 15
  communityImpactId: 'neighborhood', // 15 base -> with 25 supporters, boosted to 25
  supportCount: 25,
});
// 25 + 15 + 25 + 7 = 72 (High)
assert.strictEqual(boostedEval.score, 72);
assert(boostedEval.factors[2].value.includes('+25 supporters'));
console.log(`   Base score: ${baseEval.score} -> Recalculated with 25 supporters: ${boostedEval.score}`);
console.log('   ✓ Dynamic score recalculation verified.');

console.log('\n🎉 ALL 4 CORE VERIFICATION TEST SUITES PASSED!\n');
