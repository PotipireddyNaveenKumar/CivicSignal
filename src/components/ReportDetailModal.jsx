import { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  ThumbsUp,
  ShieldCheck,
  CheckCircle,
  Truck,
  UserCheck,
  FileCheck2,
  Wrench,
} from 'lucide-react';

const DEPARTMENTS = [
  'Traffic Engineering & Electrical Signals',
  'Road Maintenance & Asphalt Operations',
  'Sanitation, Waste & Code Compliance',
  'Civil Works & ADA Pedestrian Division',
  'Parks, Forestry & Urban Environment',
  'Municipal Water & Drainage Facilities',
];

export default function ReportDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onUpvote,
  onAssignReport,
  onResolveReport,
  userRole = 'CITIZEN',
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Administrative assignment state
  const [assignDept, setAssignDept] = useState(DEPARTMENTS[0]);
  const [resolverName, setResolverName] = useState('Rapid Response Unit #4');
  const [assignNotes, setAssignNotes] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Resolver completion state
  const [resolutionText, setResolutionText] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!report) return null;

  const priority = report.priority || {};
  const factors = priority.factors || [];
  const supporters = Array.isArray(report.supportedBy) ? report.supportedBy : [];
  const isSupportedByLocalUser = supporters.includes('citizen-local');
  const supportCount = report.supportCount || report.upvotes || 1;

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== report.status) {
      onUpdateStatus(report.id, newStatus);
    }
  };

  const handleExecuteAssign = (e) => {
    e.preventDefault();
    if (onAssignReport) {
      onAssignReport(report.id, {
        department: assignDept,
        resolverName: resolverName.trim() || 'Assigned Field Crew',
        notes: assignNotes.trim(),
        adminName: 'Municipal Operations Dispatch',
      });
      setShowAssignForm(false);
    }
  };

  const handleExecuteStartWork = () => {
    if (onUpdateStatus) {
      onUpdateStatus(report.id, 'In Progress', 'Field unit arrived on site and commenced remediation.');
    }
  };

  const handleExecuteResolve = (e) => {
    e.preventDefault();
    if (onResolveReport) {
      onResolveReport(report.id, {
        status: 'Resolved',
        resolutionNotes: resolutionText.trim() || 'Work verified complete and safety perimeter restored.',
        resolverName: report.assignedTo?.resolverName || 'Field Operations',
      });
      setShowResolveForm(false);
    }
  };

  const formattedDate = new Date(report.submittedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-report-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {report.id}
            </span>
            <span className="category-tag">{report.category}</span>
            <span
              className={`status-pill status-pill-${
                report.status.toLowerCase().replace(' ', '')
              }`}
            >
              {report.status}
            </span>
            <span className={`priority-pill priority-pill-${priority.tierKey || 'low'}`}>
              <span className="priority-dot" />
              {priority.tierLabel || 'Standard'} ({priority.score || 50}/100)
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close report details dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Title & Location */}
          <div>
            <h2 id="modal-report-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
              {report.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={15} />
                {report.location}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} />
                {formattedDate}
              </span>
              {report.coordinates && (
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--green-800)' }}>
                  📍 [{report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}]
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Condition Description</h3>
            <p style={{ lineHeight: 1.6 }}>{report.description}</p>
          </div>

          {/* Assignment Information Banner */}
          {report.assignedTo && (
            <div className="workflow-card workflow-card-assigned">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                <Truck size={16} style={{ color: 'var(--green-800)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-950)' }}>
                  Assigned Operational Unit
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--green-900)' }}>
                <strong>{report.assignedTo.department}</strong> — {report.assignedTo.resolverName}
              </div>
              {report.assignedTo.notes && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Instructions: {report.assignedTo.notes}
                </div>
              )}
            </div>
          )}

          {/* Resolution Summary Banner */}
          {report.status === 'Resolved' && (
            <div className="workflow-card workflow-card-resolved">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                <CheckCircle size={16} style={{ color: '#15803d' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#14532d' }}>
                  Issue Resolved & Verified
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                {report.resolutionNotes || 'Remediation completed by authorized municipal department.'}
              </div>
            </div>
          )}

          {/* Role-Specific Action Triggers */}
          {userRole === 'ADMIN' && (
            <section className="role-action-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={16} style={{ color: 'var(--green-800)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Administrator Dispatch Console</span>
                </div>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => setShowAssignForm(!showAssignForm)}
                >
                  {showAssignForm ? 'Hide Assignment' : report.assignedTo ? 'Reassign Unit' : 'Assign Resolver'}
                </button>
              </div>

              {showAssignForm && (
                <form onSubmit={handleExecuteAssign} className="role-subform">
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Department</label>
                    <select
                      className="form-select form-select-sm"
                      value={assignDept}
                      onChange={(e) => setAssignDept(e.target.value)}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Assigned Field Crew / Resolver</label>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      value={resolverName}
                      onChange={(e) => setResolverName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Dispatch & Safety Notes</label>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="e.g. Expedited response required; coordinate with traffic police"
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary btn-sm" style={{ marginTop: '0.25rem' }}>
                    <Truck size={14} /> Confirm Assignment
                  </button>
                </form>
              )}
            </section>
          )}

          {userRole === 'RESOLVER' && (
            <section className="role-action-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wrench size={16} style={{ color: 'var(--green-800)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Field Resolver Actions</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {report.status !== 'In Progress' && report.status !== 'Resolved' && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={handleExecuteStartWork}
                  >
                    <Wrench size={14} /> Start Work (Mark In Progress)
                  </button>
                )}
                {report.status !== 'Resolved' && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => setShowResolveForm(!showResolveForm)}
                  >
                    <FileCheck2 size={14} /> Complete Work & Record Resolution
                  </button>
                )}
              </div>

              {showResolveForm && (
                <form onSubmit={handleExecuteResolve} className="role-subform" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Resolution Summary & Findings</label>
                    <textarea
                      className="form-textarea form-textarea-sm"
                      rows={3}
                      placeholder="Describe the physical work done, materials replaced, or safety tests conducted..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary btn-sm">
                    <CheckCircle size={14} /> Mark as Resolved
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Photo attachment if available */}
          {report.photoUrl && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Photo Attachment</h3>
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  maxHeight: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <img
                  src={report.photoUrl}
                  alt={`Documentation photo for ${report.title}`}
                  style={{ maxHeight: 280, width: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Explainable Priority Engine Breakdown Card */}
          <section
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
            aria-labelledby="priority-breakdown-title"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--green-700)' }} />
                <h3 id="priority-breakdown-title" style={{ fontSize: '1.0625rem', margin: 0 }}>
                  Explainable Priority Engine Breakdown
                </h3>
              </div>
              <div className="priority-score-badge">
                {priority.score || 0} <span>/ 100</span>
              </div>
            </div>

            <div className="preview-score-bar-track" style={{ marginBottom: '1.25rem' }}>
              <div
                className="preview-score-bar-fill"
                style={{
                  width: `${priority.score || 0}%`,
                  backgroundColor:
                    priority.tierKey === 'urgent'
                      ? 'var(--priority-urgent-dot)'
                      : priority.tierKey === 'high'
                      ? 'var(--priority-high-dot)'
                      : priority.tierKey === 'medium'
                      ? 'var(--priority-medium-dot)'
                      : 'var(--priority-low-dot)',
                }}
              />
            </div>

            {/* Factor Cards Grid */}
            <div className="detail-factors-grid" style={{ marginBottom: '1rem' }}>
              {factors.map((f) => (
                <div key={f.key} className="detail-factor-card">
                  <div className="detail-factor-header">
                    <span className="detail-factor-name">{f.label}</span>
                    <span className="detail-factor-score">
                      +{f.score} / {f.max}
                    </span>
                  </div>
                  <div className="detail-factor-val">{f.value}</div>
                  <p className="detail-factor-desc">{f.explanation}</p>
                </div>
              ))}
            </div>

            {/* Synthesized Plain English Rationale */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                lineHeight: 1.45,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
              }}
            >
              <strong>Evaluation Rationale:</strong> {priority.synthesizedReason}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
              {priority.disclaimer}
            </p>
          </section>

          {/* Demonstration Workflow & Timeline Audit */}
          <section aria-labelledby="timeline-title">
            <h3 id="timeline-title" style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Triage Timeline & Audit Trail
            </h3>
            <div className="timeline-list">
              {(report.timeline || []).map((step, idx) => (
                <div key={idx} className="timeline-entry">
                  <span className="timeline-dot" aria-hidden="true" />
                  <div className="timeline-meta">
                    {new Date(step.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • <strong>{step.status}</strong>
                  </div>
                  <p className="timeline-note">{step.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          {/* Status changer for administrator */}
          {userRole === 'ADMIN' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="modal-status-select" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Status:
              </label>
              <select
                id="modal-status-select"
                className="filter-select"
                value={report.status}
                onChange={handleStatusChange}
              >
                <option value="Open">Open</option>
                <option value="In Review">In Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Current Status: <strong>{report.status}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Community Support Button ("I have this problem too") */}
            <button
              type="button"
              className={isSupportedByLocalUser ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => onUpvote(report.id)}
              disabled={isSupportedByLocalUser}
              title={isSupportedByLocalUser ? 'You have already confirmed this issue.' : 'Endorse: I have this problem too.'}
            >
              <ThumbsUp size={14} aria-hidden="true" />
              <span>
                {isSupportedByLocalUser ? `✓ Endorsed (${supportCount})` : `I have this problem too (${supportCount})`}
              </span>
            </button>

            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
