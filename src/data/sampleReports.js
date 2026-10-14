import { calculatePriority } from '../utils/priorityEngine.js';

/**
 * Sample Demonstration Dataset — Andhra Pradesh, India
 * NOTE: These records are explicitly identified as simulated demonstration data
 * for evaluating CivicSignal's transparent triage engine and municipal operations map.
 * They represent simulated municipal scenarios across Andhra Pradesh urban corridors
 * (Vijayawada, Guntur, Amaravati, Visakhapatnam, Vizianagaram) and are NOT real municipal emergency dispatches.
 */

const RAW_SAMPLES = [
  {
    id: 'CS-8041',
    title: 'Damaged pedestrian signal and exposed junction box near ZP High School',
    category: 'Public Safety',
    description:
      'The pedestrian crossing signal head at the intersection is damaged, and the lower junction box wiring is exposed within reach of students. School children and parents cross here during morning rush hour without traffic phase protection.',
    location: 'Bandar Road (MG Road), Near ZP High School Junction, Vijayawada, Andhra Pradesh',
    coordinates: { lat: 16.5062, lng: 80.6480 },
    safetyRiskId: 'severe',
    urgencyId: 'immediate',
    communityImpactId: 'vital',
    status: 'In Progress',
    submittedAt: '2026-10-12T08:15:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 42,
    supportedBy: ['citizen-vja-88', 'parent-bandar-102', 'commuter-liaison'],
    assignedTo: {
      department: 'Traffic Engineering & Electrical Signals',
      resolverName: 'VMC Electrical Rapid Response Crew #2',
      assignedAt: '2026-10-12T09:30:00.000Z',
      notes: 'High-priority school corridor crossing on Bandar Road. Enclosure replacement and LED controller restoration required.',
    },
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-12T08:15:00.000Z', note: 'Demonstration issue logged by local resident parent in Vijayawada.' },
      { status: 'In Review', date: '2026-10-12T09:30:00.000Z', note: 'Priority Engine classified as Urgent (Score: 100). Flagged for municipal electrical dispatch.' },
      { status: 'Assigned', date: '2026-10-12T09:45:00.000Z', note: 'Assigned to Traffic Engineering (VMC Electrical Rapid Response Crew #2).' },
      { status: 'In Progress', date: '2026-10-13T07:45:00.000Z', note: 'Technician on-site installing tamper-resistant junction housing.' },
    ],
  },
  {
    id: 'CS-8039',
    title: 'Severe roadway crater causing vehicular swerving on transit bus route',
    category: 'Roads',
    description:
      'Deep roadway depression (approx. 12 inches deep and 4 feet wide) on the main corridor near Arundelpet. RTC city buses and two-wheelers are swerving into oncoming traffic to avoid axle damage, creating risk during evening peak hours.',
    location: 'Arundelpet Main Road, Near Old Bus Stand, Guntur, Andhra Pradesh',
    coordinates: { lat: 16.3067, lng: 80.4365 },
    safetyRiskId: 'moderate',
    urgencyId: 'progressive',
    communityImpactId: 'vital',
    status: 'In Review',
    submittedAt: '2026-10-13T14:20:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 31,
    supportedBy: ['rtc-commuter-9', 'guntur-rider-12'],
    assignedTo: null,
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-13T14:20:00.000Z', note: 'Demonstration report submitted with commuter road hazard report.' },
      { status: 'In Review', date: '2026-10-13T16:00:00.000Z', note: 'Evaluated by Guntur municipal roads division. Patch remediation scheduled.' },
    ],
  },
  {
    id: 'CS-8035',
    title: 'Stormwater drain culvert blocked with construction silt ahead of monsoon',
    category: 'Environment',
    description:
      'Major roadside stormwater culvert is heavily choked with construction debris and silt runoff. Water stagnation has already inundated the pedestrian walkway and poses flood risk to adjacent residential properties.',
    location: 'Bhavanipuram Main Road, Near Drainage Outfall, Vijayawada, Andhra Pradesh',
    coordinates: { lat: 16.5245, lng: 80.6012 },
    safetyRiskId: 'minor',
    urgencyId: 'immediate',
    communityImpactId: 'neighborhood',
    status: 'Open',
    submittedAt: '2026-10-14T06:50:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 16,
    supportedBy: ['bhavanipuram-res-4'],
    assignedTo: null,
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-14T06:50:00.000Z', note: 'Demonstration report logged by neighborhood welfare association.' },
    ],
  },
  {
    id: 'CS-8028',
    title: 'Missing tactile curb ramp transition near District Government Hospital',
    category: 'Accessibility',
    description:
      'Steep 6-inch vertical curb drop without tactile warning pavers or ramp incline. Wheelchair patients, senior citizens, and visually impaired visitors are forced onto the vehicle carriageway to access the outpatient entrance.',
    location: 'Hospital Road, Opposite District Government Hospital, Visakhapatnam, Andhra Pradesh',
    coordinates: { lat: 17.7126, lng: 83.3032 },
    safetyRiskId: 'moderate',
    urgencyId: 'routine',
    communityImpactId: 'vital',
    status: 'In Progress',
    submittedAt: '2026-10-10T11:00:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 38,
    supportedBy: ['vizag-disability-advocate', 'hospital-visitor-3'],
    assignedTo: {
      department: 'Civil Works & ADA Pedestrian Division',
      resolverName: 'GVMC Pedestrian Accessibility Infrastructure Wing',
      assignedAt: '2026-10-11T09:30:00.000Z',
      notes: 'Priority hospital zone curb cut and tactile paver installation.',
    },
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-10T11:00:00.000Z', note: 'Accessibility barrier reported by healthcare accessibility volunteer.' },
      { status: 'In Review', date: '2026-10-11T09:00:00.000Z', note: 'Evaluated by municipal civil engineering division.' },
      { status: 'Assigned', date: '2026-10-11T09:30:00.000Z', note: 'Assigned to GVMC Pedestrian Infrastructure Wing.' },
      { status: 'In Progress', date: '2026-10-13T10:00:00.000Z', note: 'Civil contractor initiated concrete ramp excavation and paver leveling.' },
    ],
  },
  {
    id: 'CS-8022',
    title: 'Unauthorized packaging pallet and commercial dry waste dumping in service lane',
    category: 'Waste Management',
    description:
      'Commercial cardboard boxes, wooden scrap, and plastic packaging dumped in market lane, blocking emergency access for fire tenders and creating acute fire hazard behind dense commercial shops.',
    location: 'Brodipet 4th Line Commercial Lane, Guntur, Andhra Pradesh',
    coordinates: { lat: 16.3120, lng: 80.4420 },
    safetyRiskId: 'minor',
    urgencyId: 'progressive',
    communityImpactId: 'neighborhood',
    status: 'Resolved',
    submittedAt: '2026-10-08T16:30:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 12,
    supportedBy: ['brodipet-trader-assoc'],
    assignedTo: {
      department: 'Sanitation, Waste & Code Compliance',
      resolverName: 'GMC Solid Waste Enforcement Squad',
      assignedAt: '2026-10-09T08:30:00.000Z',
      notes: 'Illegal dumping clearance and shopkeeper compliance inspection.',
    },
    resolutionNotes: 'Commercial alleyway cleared using municipal tipper trucks. Encroachment citation issued to non-compliant traders.',
    timeline: [
      { status: 'Open', date: '2026-10-08T16:30:00.000Z', note: 'Logged with commercial waste violation tag in Guntur.' },
      { status: 'In Review', date: '2026-10-09T08:30:00.000Z', note: 'Sanitation inspector confirmed fire hazard and access blockage.' },
      { status: 'In Progress', date: '2026-10-09T13:00:00.000Z', note: 'Municipal bulk disposal vehicle deployed.' },
      { status: 'Resolved', date: '2026-10-10T15:30:00.000Z', note: 'Service lane fully cleared and restored to open pedestrian flow.' },
    ],
  },
  {
    id: 'CS-8019',
    title: 'Exposed live streetlight power terminal at public children’s park',
    category: 'Public Safety',
    description:
      'Protective metal base plate missing from high-mast lighting pole at the public park walking track. Live insulated wiring is exposed 2 feet from ground level where children play daily.',
    location: 'Rajiv Gandhi Municipal Park, Beside Krishna River Canal, Vijayawada, Andhra Pradesh',
    coordinates: { lat: 16.5140, lng: 80.6280 },
    safetyRiskId: 'severe',
    urgencyId: 'immediate',
    communityImpactId: 'vital',
    status: 'Resolved',
    submittedAt: '2026-10-07T15:10:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 54,
    supportedBy: ['vja-park-parent-1', 'canal-walker-5'],
    assignedTo: {
      department: 'Traffic Engineering & Electrical Signals',
      resolverName: 'VMC Electrical Rapid Response Crew #1',
      assignedAt: '2026-10-07T15:25:00.000Z',
      notes: 'Emergency public park electrocution hazard containment.',
    },
    resolutionNotes: 'Power isolated immediately; heavy-duty lockable galvanized steel cover plate installed and grounded.',
    timeline: [
      { status: 'Open', date: '2026-10-07T15:10:00.000Z', note: 'High urgency park safety hazard logged by evening walker.' },
      { status: 'In Review', date: '2026-10-07T15:25:00.000Z', note: 'Emergency parks electrical supervisor dispatched via triage priority alert.' },
      { status: 'In Progress', date: '2026-10-07T16:00:00.000Z', note: 'Power isolated and protective barrier placed.' },
      { status: 'Resolved', date: '2026-10-08T10:00:00.000Z', note: 'New tamper-resistant terminal junction box installed and continuity verified.' },
    ],
  },
  {
    id: 'CS-8014',
    title: 'Dense road divider foliage obstructing vehicular sightline at arterial intersection',
    category: 'Roads',
    description:
      'Unpruned median shrubs have grown 6 feet tall, completely blinding drivers turning right onto the Seed Access corridor. Multiple close-call collisions reported during dusk hours.',
    location: 'Seed Access Road Junction, Near Rayapudi, Amaravati, Andhra Pradesh',
    coordinates: { lat: 16.5218, lng: 80.5280 },
    safetyRiskId: 'moderate',
    urgencyId: 'progressive',
    communityImpactId: 'neighborhood',
    status: 'Open',
    submittedAt: '2026-10-13T18:40:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 19,
    supportedBy: ['amaravati-commuter-2'],
    assignedTo: null,
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-13T18:40:00.000Z', note: 'Reported by local driver after near-miss collision at Amaravati intersection.' },
    ],
  },
  {
    id: 'CS-8008',
    title: 'Repeatedly flickering LED high-mast streetlight causing strobing disruption',
    category: 'Public Services',
    description:
      'High-mast municipal LED fixture cycles erratically every 45 seconds on residential transit lane near RTC complex. Flickering creates severe strobing glare across residential balconies.',
    location: 'RTC Complex Approach Road, Vizianagaram, Andhra Pradesh',
    coordinates: { lat: 18.1158, lng: 83.4076 },
    safetyRiskId: 'none',
    urgencyId: 'routine',
    communityImpactId: 'isolated',
    status: 'In Review',
    submittedAt: '2026-10-11T20:15:00.000Z',
    photoUrl: null,
    isDemonstration: true,
    supportCount: 5,
    supportedBy: ['vizianagaram-resident-44'],
    assignedTo: null,
    resolutionNotes: null,
    timeline: [
      { status: 'Open', date: '2026-10-11T20:15:00.000Z', note: 'Logged for routine municipal streetlight driver maintenance in Vizianagaram.' },
      { status: 'In Review', date: '2026-10-12T11:00:00.000Z', note: 'Added to scheduled municipal maintenance route.' },
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
    supportCount: item.supportCount || 0,
  });

  return {
    ...item,
    upvotes: item.supportCount,
    priority: priorityEvaluation,
  };
});
