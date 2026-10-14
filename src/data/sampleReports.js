import { calculatePriority } from '../utils/priorityEngine';

/**
 * Sample Demonstration Dataset
 * NOTE: These records are explicitly identified as simulated demonstration data
 * for evaluating CivicSignal's client-side triage engine.
 * They are NOT real municipal records or official public agency dispatches.
 */

const RAW_SAMPLES = [
  {
    id: 'CS-8041',
    title: 'Faulty pedestrian crossing signal at elementary school crosswalk',
    category: 'Public Safety',
    description:
      'The walk/don’t walk pedestrian signal head at the intersection is completely unlit. Children and crossing guards are forced to cross during vehicle turn phases with zero pedestrian phase protection.',
    location: 'Corner of 4th Ave & Lincoln St, outside Lincoln Elementary School',
    safetyRiskId: 'severe',
    urgencyId: 'immediate',
    communityImpactId: 'vital',
    status: 'In Progress',
    submittedAt: '2026-10-12T08:15:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 42,
    timeline: [
      { status: 'Open', date: '2026-10-12T08:15:00.000Z', note: 'Demonstration issue logged by neighborhood parent.' },
      { status: 'In Review', date: '2026-10-12T09:30:00.000Z', note: 'Priority Engine classified as Urgent (Score: 100). Flagged for electrical crew dispatch.' },
      { status: 'In Progress', date: '2026-10-13T07:45:00.000Z', note: 'Signal technician dispatched with replacement LED controller board.' },
    ],
  },
  {
    id: 'CS-8039',
    title: 'Severe roadway crater causing wheel rim damage on transit route',
    category: 'Roads',
    description:
      'Deep pothole (approx. 10 inches deep and 3 feet wide) in the eastbound lane. Vehicles are swerving into oncoming traffic to avoid rim collapse. Bus route #14 passes here every 12 minutes.',
    location: '720 East Pine Street, between 7th and 8th Avenue',
    safetyRiskId: 'moderate',
    urgencyId: 'progressive',
    communityImpactId: 'vital',
    status: 'In Review',
    submittedAt: '2026-10-13T14:20:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 29,
    timeline: [
      { status: 'Open', date: '2026-10-13T14:20:00.000Z', note: 'Demonstration report submitted with vehicle damage report.' },
      { status: 'In Review', date: '2026-10-13T16:00:00.000Z', note: 'Reviewed by road maintenance coordinator. Asphalt patch team scheduled.' },
    ],
  },
  {
    id: 'CS-8035',
    title: 'Storm drain clogged with heavy yard debris ahead of weekend rainfall',
    category: 'Environment',
    description:
      'Curbside grate is completely packed with leaves, gravel, and branches. Ponding has already begun extending 4 feet onto the sidewalk and roadway.',
    location: '1410 Elmwood Terrace, near drainage culvert',
    safetyRiskId: 'minor',
    urgencyId: 'immediate',
    communityImpactId: 'neighborhood',
    status: 'Open',
    submittedAt: '2026-10-14T06:50:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 16,
    timeline: [
      { status: 'Open', date: '2026-10-14T06:50:00.000Z', note: 'Demonstration report logged by resident prior to storm.' },
    ],
  },
  {
    id: 'CS-8028',
    title: 'Missing tactile curb ramp transition near Senior Community Center',
    category: 'Accessibility',
    description:
      'Steep 5-inch vertical curb without ADA-compliant tactile warning pavers or ramp incline. Wheelchair and walker users are forced to travel in the vehicular street bed to access the ramp 150 feet away.',
    location: 'Northwest corner of Birch Street & Heritage Way',
    safetyRiskId: 'moderate',
    urgencyId: 'routine',
    communityImpactId: 'vital',
    status: 'In Progress',
    submittedAt: '2026-10-10T11:00:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 38,
    timeline: [
      { status: 'Open', date: '2026-10-10T11:00:00.000Z', note: 'Accessibility barrier reported by local senior advocate.' },
      { status: 'In Review', date: '2026-10-11T09:00:00.000Z', note: 'Evaluated by ADA pedestrian compliance division.' },
      { status: 'In Progress', date: '2026-10-13T10:00:00.000Z', note: 'Civil contractor scheduled for concrete curb cut and paver install.' },
    ],
  },
  {
    id: 'CS-8022',
    title: 'Commercial cardboard & pallet dumping in residential service alley',
    category: 'Waste Management',
    description:
      'Approx. 15 wooden pallets and stacked packaging boxes dumped behind commercial strip, blocking private driveway access and creating a localized fire hazard.',
    location: 'Alleyway behind 340 Oak Boulevard',
    safetyRiskId: 'minor',
    urgencyId: 'progressive',
    communityImpactId: 'neighborhood',
    status: 'Resolved',
    submittedAt: '2026-10-08T16:30:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 12,
    timeline: [
      { status: 'Open', date: '2026-10-08T16:30:00.000Z', note: 'Logged with commercial waste violation tag.' },
      { status: 'In Review', date: '2026-10-09T08:30:00.000Z', note: 'Sanitation inspection confirmed unauthorized dumping.' },
      { status: 'In Progress', date: '2026-10-09T13:00:00.000Z', note: 'Bulk disposal flatbed dispatched.' },
      { status: 'Resolved', date: '2026-10-10T15:30:00.000Z', note: 'Alleyway completely cleared and commercial property owner cited.' },
    ],
  },
  {
    id: 'CS-8019',
    title: 'Exposed live wiring junction at municipal park gazebo pavilion',
    category: 'Public Safety',
    description:
      'Protective metal plate was pried off the decorative lamp post at the public children’s playground gazebo. Bare wire connectors are exposed within 3 feet of child hand height.',
    location: 'Riverside Community Park, Central Gazebo Pavilion',
    safetyRiskId: 'severe',
    urgencyId: 'immediate',
    communityImpactId: 'vital',
    status: 'Resolved',
    submittedAt: '2026-10-07T15:10:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 54,
    timeline: [
      { status: 'Open', date: '2026-10-07T15:10:00.000Z', note: 'High urgency park safety hazard logged.' },
      { status: 'In Review', date: '2026-10-07T15:25:00.000Z', note: 'Emergency parks supervisor notified via automated high-priority triage.' },
      { status: 'In Progress', date: '2026-10-07T16:00:00.000Z', note: 'Power isolated; security enclosure installed.' },
      { status: 'Resolved', date: '2026-10-08T10:00:00.000Z', note: 'Tamper-resistant junction box and conduit fully restored.' },
    ],
  },
  {
    id: 'CS-8014',
    title: 'Overgrown hedge obscuring stop sign visibility at 4-way intersection',
    category: 'Roads',
    description:
      'Dense privet hedge branches have grown into the sightline of the westbound stop sign. Drivers only see the sign when within 15 feet of the intersection line.',
    location: 'Intersection of Chestnut Way & 11th Street',
    safetyRiskId: 'moderate',
    urgencyId: 'progressive',
    communityImpactId: 'neighborhood',
    status: 'Open',
    submittedAt: '2026-10-13T18:40:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 19,
    timeline: [
      { status: 'Open', date: '2026-10-13T18:40:00.000Z', note: 'Reported by local driver after near-miss collision.' },
    ],
  },
  {
    id: 'CS-8008',
    title: 'Flickering high-pressure sodium street lamp on residential cul-de-sac',
    category: 'Public Services',
    description:
      'Lamp cycles on and off every 90 seconds. While the street is not pitch black, the cycling creates annoying strobing across bedroom windows.',
    location: 'Pole #44, Sycamore Court cul-de-sac',
    safetyRiskId: 'none',
    urgencyId: 'routine',
    communityImpactId: 'isolated',
    status: 'In Review',
    submittedAt: '2026-10-11T20:15:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    upvotes: 4,
    timeline: [
      { status: 'Open', date: '2026-10-11T20:15:00.000Z', note: 'Logged for routine municipal streetlight bulb replacement.' },
      { status: 'In Review', date: '2026-10-12T11:00:00.000Z', note: 'Added to scheduled utility route.' },
    ],
  },
];

/**
 * Returns sample records populated with the deterministic priority calculation
 */
export const SAMPLE_REPORTS = RAW_SAMPLES.map((item) => {
  const priorityEvaluation = calculatePriority({
    category: item.category,
    safetyRiskId: item.safetyRiskId,
    urgencyId: item.urgencyId,
    communityImpactId: item.communityImpactId,
  });

  return {
    ...item,
    priority: priorityEvaluation,
  };
});
