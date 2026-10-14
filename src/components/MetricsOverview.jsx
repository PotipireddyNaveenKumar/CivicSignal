import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  Wrench,
  Truck,
  ShieldAlert,
} from 'lucide-react';

export default function MetricsOverview({ reports = [], onFilterByMetric, userRole = 'CITIZEN' }) {
  const total = reports.length;

  const highPriorityCount = reports.filter((r) => {
    const tier = r.priority?.tierKey;
    return tier === 'urgent' || tier === 'high';
  }).length;

  const inProgressCount = reports.filter(
    (r) => r.status === 'In Progress' || r.status === 'In Review'
  ).length;

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const assignedCount = reports.filter((r) => r.assignedTo !== null).length;

  const resolverCriticalCount = reports.filter(
    (r) => r.assignedTo !== null && (r.priority?.tierKey === 'urgent' || r.priority?.tierKey === 'high')
  ).length;

  return (
    <section aria-labelledby="metrics-heading" style={{ marginBottom: '2.5rem' }}>
      <h2 id="metrics-heading" className="sr-only" style={{ display: 'none' }}>
        Community Metrics Overview
      </h2>

      {/* Mandatory Demonstration Notice */}
      <div className="demo-banner" role="status" aria-live="polite">
        <Info className="demo-banner-icon" aria-hidden="true" />
        <div>
          <strong>Demonstration Environment Notice (Andhra Pradesh, India):</strong> Figures reflect simulated
          sample demonstration records across Vijayawada, Guntur, Amaravati, and Visakhapatnam urban corridors,
          and local browser submissions. This platform is an open civic-technology prototype and is not connected
          to official government 112 emergency dispatch.
        </div>
      </div>

      <div className="metrics-grid">
        {userRole === 'RESOLVER' ? (
          <>
            {/* Field Unit Work Orders */}
            <button
              type="button"
              className="metric-card highlight-progress"
              onClick={() => onFilterByMetric && onFilterByMetric('in_progress')}
              aria-label={`Assigned work orders: ${assignedCount}. Click to view.`}
            >
              <div className="metric-card-header">
                <span className="metric-label">Assigned Work Orders</span>
                <div className="metric-icon-box" aria-hidden="true">
                  <Truck size={16} />
                </div>
              </div>
              <div className="metric-value">{assignedCount}</div>
              <p className="metric-subtext">Active field dispatches</p>
            </button>

            {/* Critical Safety Work Orders */}
            <button
              type="button"
              className="metric-card highlight-urgent"
              onClick={() => onFilterByMetric && onFilterByMetric('urgent_high')}
              aria-label={`Critical safety jobs: ${resolverCriticalCount}. Click to view.`}
            >
              <div className="metric-card-header">
                <span className="metric-label">High-Risk Jobs</span>
                <div className="metric-icon-box" aria-hidden="true">
                  <ShieldAlert size={16} />
                </div>
              </div>
              <div className="metric-value">{resolverCriticalCount}</div>
              <p className="metric-subtext">Urgent physical risk score</p>
            </button>

            {/* In Progress Active Tasks */}
            <button
              type="button"
              className="metric-card"
              onClick={() => onFilterByMetric && onFilterByMetric('in_progress')}
              aria-label={`Tasks in progress: ${inProgressCount}. Click to view.`}
            >
              <div className="metric-card-header">
                <span className="metric-label">Remediation Active</span>
                <div className="metric-icon-box" aria-hidden="true">
                  <Wrench size={16} />
                </div>
              </div>
              <div className="metric-value">{inProgressCount}</div>
              <p className="metric-subtext">Field teams on site</p>
            </button>

            {/* Completed Work */}
            <button
              type="button"
              className="metric-card highlight-resolved"
              onClick={() => onFilterByMetric && onFilterByMetric('resolved')}
              aria-label={`Completed tasks: ${resolvedCount}. Click to view.`}
            >
              <div className="metric-card-header">
                <span className="metric-label">Completed Tasks</span>
                <div className="metric-icon-box" aria-hidden="true">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="metric-value">{resolvedCount}</div>
              <p className="metric-subtext">Verified remediated</p>
            </button>
          </>
        ) : (
          <>
            {/* Total Reports */}
            <button
              type="button"
              className="metric-card"
              onClick={() => onFilterByMetric && onFilterByMetric('all')}
              aria-label={`Total reports: ${total}. Click to view all reports.`}
            >
              <div className="metric-card-header">
                <span className="metric-label">
                  {userRole === 'ADMIN' ? 'Total Triage Queue' : 'Total Reports'}
                </span>
                <div className="metric-icon-box" aria-hidden="true">
                  <FileText size={16} />
                </div>
              </div>
              <div className="metric-value">{total}</div>
              <p className="metric-subtext">
                {userRole === 'ADMIN' ? 'All municipal queue items' : 'Community records filed'}
              </p>
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
          </>
        )}
      </div>
    </section>
  );
}
