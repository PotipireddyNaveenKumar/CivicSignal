import { useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calendar,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';

export default function ReportDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onUpvote,
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

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

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== report.status) {
      onUpdateStatus(report.id, newStatus);
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
              {priority.tierLabel || 'Standard'}
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
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Condition Description</h3>
            <p style={{ lineHeight: 1.6 }}>{report.description}</p>
          </div>

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
          {/* Status changer for demonstration testing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="modal-status-select" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Demonstration Status:
            </label>
            <select
              id="modal-status-select"
              className="filter-select"
              value={report.status}
              onChange={handleStatusChange}
            >
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => onUpvote(report.id)}
              aria-label={`Endorse report. Current count: ${report.upvotes || 0}`}
            >
              <ThumbsUp size={14} aria-hidden="true" />
              <span>Endorse ({report.upvotes || 0})</span>
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
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
