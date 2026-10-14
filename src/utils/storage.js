import { SAMPLE_REPORTS } from '../data/sampleReports.js';
import { calculatePriority } from './priorityEngine.js';

export const STORAGE_KEY = 'civicsignal_reports_v1';

/**
 * Custom error class for browser storage quota exhaustion.
 */
export class StorageQuotaError extends Error {
  constructor(message = 'Browser local storage quota exceeded. The storage limit has been reached.', options) {
    super(message, options);
    this.name = 'StorageQuotaError';
  }
}

/**
 * Determines whether a caught error is a browser storage quota exception.
 * @param {any} err
 * @returns {boolean}
 */
export function isQuotaExceededError(err) {
  if (!err) return false;
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
      err.code === 1014 ||
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

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
 * Saves reports to localStorage with explicit quota error handling.
 * @param {Array} reports
 * @throws {StorageQuotaError} If storage quota is exceeded
 * @throws {Error} If other serialization/storage errors occur
 */
export function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new StorageQuotaError(
        'Browser local storage quota exceeded. The storage limit has been reached. Please clear demo data or remove large photo attachments to continue.',
        { cause: error }
      );
    }
    throw new Error(`Failed to save reports to browser storage: ${error?.message || error}`, {
      cause: error,
    });
  }
}

/**
 * Adds a new report created by the user.
 * Validates storage persistence before returning.
 * @param {Object} reportData
 * @returns {{ newReport: Object, updatedReports: Array }}
 * @throws {StorageQuotaError|Error} If saving fails
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
    supportCount: 1,
  });

  const newReport = {
    id: newId,
    title: reportData.title.trim(),
    category: reportData.category,
    description: reportData.description.trim(),
    location: reportData.location.trim(),
    coordinates: reportData.coordinates || null,
    safetyRiskId: reportData.safetyRiskId,
    urgencyId: reportData.urgencyId,
    communityImpactId: reportData.communityImpactId,
    photoUrl: reportData.photoUrl || null,
    status: 'Open',
    submittedAt: now,
    isDemonstration: false,
    supportCount: 1,
    upvotes: 1,
    supportedBy: ['citizen-reporter'],
    assignedTo: null,
    resolutionNotes: null,
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
  // Explicitly saves and re-throws if quota or storage fails
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
 * Endorses / supports an existing report ("I have this problem too").
 * Bounded by unique user identifier to prevent repeated spam.
 * Dynamically recalculates priority score while preserving safety authority.
 *
 * @param {string} id Report ID
 * @param {string} [userId='citizen-local'] Unique local user identifier
 * @returns {{ reports: Array, success: boolean, alreadySupported: boolean }}
 */
export function supportReport(id, userId = 'citizen-local') {
  const current = getStoredReports();
  const now = new Date().toISOString();

  const target = current.find((r) => r.id === id);
  if (!target) return { reports: current, success: false, alreadySupported: false };

  const existingSupporters = Array.isArray(target.supportedBy) ? target.supportedBy : [];
  if (existingSupporters.includes(userId)) {
    return { reports: current, success: false, alreadySupported: true };
  }

  const newSupporters = [...existingSupporters, userId];
  const newCount = (target.supportCount || target.upvotes || 0) + 1;

  // Recalculate deterministic priority with updated support
  const newPriority = calculatePriority({
    category: target.category,
    safetyRiskId: target.safetyRiskId,
    urgencyId: target.urgencyId,
    communityImpactId: target.communityImpactId,
    supportCount: newCount,
  });

  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const timelineEntry = {
      status: r.status,
      date: now,
      note: `Community endorsement confirmed (Total: ${newCount} citizens). Priority score recalculated: ${newPriority.score}/100 (${newPriority.tierLabel}).`,
    };

    return {
      ...r,
      supportCount: newCount,
      upvotes: newCount,
      supportedBy: newSupporters,
      priority: newPriority,
      timeline: [...(r.timeline || []), timelineEntry],
    };
  });

  saveReports(updated);
  return { reports: updated, success: true, alreadySupported: false };
}

/**
 * Backward compatibility alias for toggleReportUpvote
 */
export function toggleReportUpvote(id) {
  const res = supportReport(id, 'citizen-local');
  return res.reports;
}

/**
 * Administrator action: Assigns an issue to an authorized department/resolver.
 * @param {string} id
 * @param {Object} details
 * @param {string} details.department
 * @param {string} details.resolverName
 * @param {string} details.notes
 * @param {string} [details.adminName='Municipal Administrator']
 * @returns {Array} Updated reports
 */
export function assignReport(id, { department, resolverName, notes, adminName = 'Municipal Dispatcher' }) {
  const current = getStoredReports();
  const now = new Date().toISOString();

  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const assignment = {
      department,
      resolverName,
      assignedAt: now,
      notes: notes || 'Assigned via municipal dispatch console.',
    };

    const timelineEntry = {
      status: 'Assigned',
      date: now,
      note: `Assigned to ${department} (${resolverName}) by ${adminName}. Notes: ${notes || 'None'}`,
    };

    return {
      ...r,
      status: 'Assigned',
      assignedTo: assignment,
      timeline: [...(r.timeline || []), timelineEntry],
    };
  });

  saveReports(updated);
  return updated;
}

/**
 * Resolver action: Updates report resolution notes and sets status.
 * @param {string} id
 * @param {Object} details
 * @param {string} details.status 'In Progress' | 'Resolved'
 * @param {string} details.resolutionNotes
 * @param {string} [details.resolverName='Authorized Field Tech']
 * @returns {Array} Updated reports
 */
export function updateReportResolution(id, { status, resolutionNotes, resolverName = 'Authorized Field Tech' }) {
  const current = getStoredReports();
  const now = new Date().toISOString();

  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const timelineEntry = {
      status,
      date: now,
      note: `Work ${status.toLowerCase()} by ${resolverName}. Resolution Notes: ${resolutionNotes || 'Operational checklist complete.'}`,
    };

    return {
      ...r,
      status,
      resolutionNotes: resolutionNotes || r.resolutionNotes,
      resolvedAt: status === 'Resolved' ? now : r.resolvedAt,
      timeline: [...(r.timeline || []), timelineEntry],
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
    console.warn('Could not reset demo reports in localStorage:', e);
  }
  return SAMPLE_REPORTS;
}
