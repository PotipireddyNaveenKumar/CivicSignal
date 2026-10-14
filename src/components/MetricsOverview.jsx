import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function MetricsOverview({ reports = [], onFilterByMetric }) {
  const total = reports.length;

  const highPriorityCount = reports.filter((r) => {
    const tier = r.priority?.tierKey;
    return tier === 'urgent' || tier === 'high';
  }).length;

  const inProgressCount = reports.filter(
    (r) => r.status === 'In Progress' || r.status === 'In Review'
  ).length;

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  return (
    <section aria-labelledby="metrics-heading" style={{ marginBottom: '2.5rem' }}>
      <h2 id="metrics-heading" className="sr-only" style={{ display: 'none' }}>
        Community Metrics Overview
      </h2>

      {/* Mandatory Demonstration Notice */}
      <div className="demo-banner" role="status" aria-live="polite">
        <Info className="demo-banner-icon" aria-hidden="true" />
        <div>
          <strong>Demonstration Environment Notice:</strong> Figures reflect simulated
          sample demonstration records and local browser submissions. This platform is an
          open civic-technology prototype and is not connected to official municipal dispatch, 311,
          or emergency services.
        </div>
      </div>

      <div className="metrics-grid">
        {/* Total Reports */}
        <button
          type="button"
          className="metric-card"
          onClick={() => onFilterByMetric && onFilterByMetric('all')}
          aria-label={`Total reports: ${total}. Click to view all reports.`}
        >
          <div className="metric-card-header">
            <span className="metric-label">Total Reports</span>
            <div className="metric-icon-box" aria-hidden="true">
              <FileText size={16} />
            </div>
          </div>
          <div className="metric-value">{total}</div>
          <p className="metric-subtext">Community records filed locally</p>
        </button>

        {/* High Priority */}
        <button
          type="button"
          className="metric-card highlight-urgent"
          onClick={() => onFilterByMetric && onFilterByMetric('urgent_high')}
          aria-label={`High-priority reports: ${highPriorityCount}. Click to filter high-priority reports.`}
        >
          <div className="metric-card-header">
            <span className="metric-label">High-Priority</span>
            <div className="metric-icon-box" aria-hidden="true">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="metric-value">{highPriorityCount}</div>
          <p className="metric-subtext">Urgent or high safety risk scores</p>
        </button>

        {/* Issues In Progress */}
        <button
          type="button"
          className="metric-card highlight-progress"
          onClick={() => onFilterByMetric && onFilterByMetric('in_progress')}
          aria-label={`Issues in progress: ${inProgressCount}. Click to view in-progress reports.`}
        >
          <div className="metric-card-header">
            <span className="metric-label">In Progress</span>
            <div className="metric-icon-box" aria-hidden="true">
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value">{inProgressCount}</div>
          <p className="metric-subtext">Under review or crew scheduled</p>
        </button>

        {/* Resolved */}
        <button
          type="button"
          className="metric-card highlight-resolved"
          onClick={() => onFilterByMetric && onFilterByMetric('resolved')}
          aria-label={`Resolved issues: ${resolvedCount}. Click to view resolved reports.`}
        >
          <div className="metric-card-header">
            <span className="metric-label">Resolved</span>
            <div className="metric-icon-box" aria-hidden="true">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value">{resolvedCount}</div>
          <p className="metric-subtext">Verified remediated & cleared</p>
        </button>
      </div>
    </section>
  );
}
