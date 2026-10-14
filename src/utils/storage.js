import { SAMPLE_REPORTS } from '../data/sampleReports';
import { calculatePriority } from './priorityEngine';

const STORAGE_KEY = 'civicsignal_reports_v1';

/**
 * Loads reports from localStorage or seeds with default demonstration data.
 * @returns {Array} List of reports
 */
export function getStoredReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REPORTS));
      return SAMPLE_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REPORTS));
    return SAMPLE_REPORTS;
  } catch (error) {
    console.warn('Could not read from localStorage, using default sample reports:', error);
    return SAMPLE_REPORTS;
  }
}

/**
 * Saves reports to localStorage.
 * @param {Array} reports
 */
export function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Failed to save reports to localStorage:', error);
  }
}

/**
 * Adds a new report created by the user.
 * @param {Object} reportData
 * @returns {Array} Updated reports list
 */
export function addReport(reportData) {
  const current = getStoredReports();
  const newId = `CS-${Math.floor(8200 + Math.random() * 800)}`;
  const now = new Date().toISOString();

  const priority = calculatePriority({
    category: reportData.category,
    safetyRiskId: reportData.safetyRiskId,
    urgencyId: reportData.urgencyId,
    communityImpactId: reportData.communityImpactId,
  });

  const newReport = {
    id: newId,
    title: reportData.title.trim(),
    category: reportData.category,
    description: reportData.description.trim(),
    location: reportData.location.trim(),
    safetyRiskId: reportData.safetyRiskId,
    urgencyId: reportData.urgencyId,
    communityImpactId: reportData.communityImpactId,
    photoUrl: reportData.photoUrl || null,
    status: 'Open',
    submittedAt: now,
    isDemonstration: false,
    upvotes: 1,
    priority,
    timeline: [
      {
        status: 'Open',
        date: now,
        note: `Report filed via CivicSignal web portal. Priority engine calculated initial score: ${priority.score} (${priority.tierLabel}).`,
      },
    ],
  };

  const updated = [newReport, ...current];
  saveReports(updated);
  return { newReport, updatedReports: updated };
}

/**
 * Updates a report's status (for demonstration and operational testing).
 * @param {string} id
 * @param {string} newStatus
 * @param {string} [note]
 * @returns {Array} Updated reports list
 */
export function updateReportStatus(id, newStatus, note = '') {
  const current = getStoredReports();
  const now = new Date().toISOString();

  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const newTimeline = [
      ...(r.timeline || []),
      {
        status: newStatus,
        date: now,
        note: note || `Status updated to ${newStatus} in local demonstration queue.`,
      },
    ];
    return {
      ...r,
      status: newStatus,
      timeline: newTimeline,
    };
  });

  saveReports(updated);
  return updated;
}

/**
 * Toggles an upvote on a community report.
 * @param {string} id
 * @returns {Array} Updated reports list
 */
export function toggleReportUpvote(id) {
  const current = getStoredReports();
  const updated = current.map((r) => {
    if (r.id !== id) return r;
    return {
      ...r,
      upvotes: (r.upvotes || 0) + 1,
    };
  });
  saveReports(updated);
  return updated;
}

/**
 * Resets storage back to original sample dataset.
 * @returns {Array} Default sample reports
 */
export function resetToDefaultReports() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REPORTS));
  } catch (e) {
    console.warn(e);
  }
  return SAMPLE_REPORTS;
}
