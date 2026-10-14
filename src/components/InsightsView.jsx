import { CATEGORIES } from '../utils/priorityEngine';
import {
  ShieldCheck,
  BarChart2,
  Scale,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function InsightsView({ reports = [] }) {
  const total = reports.length || 1;

  // Priority tier distribution
  const tierCounts = {
    urgent: reports.filter((r) => r.priority?.tierKey === 'urgent').length,
    high: reports.filter((r) => r.priority?.tierKey === 'high').length,
    medium: reports.filter((r) => r.priority?.tierKey === 'medium').length,
    low: reports.filter((r) => r.priority?.tierKey === 'low').length,
  };

  // Status breakdown
  const statusCounts = {
    Open: reports.filter((r) => r.status === 'Open').length,
    'In Review': reports.filter((r) => r.status === 'In Review').length,
    'In Progress': reports.filter((r) => r.status === 'In Progress').length,
    Resolved: reports.filter((r) => r.status === 'Resolved').length,
  };

  // Category counts
  const categoryCounts = CATEGORIES.map((cat) => ({
    name: cat,
    count: reports.filter((r) => r.category === cat).length,
  })).sort((a, b) => b.count - a.count);

  // Average score
  const avgScore = Math.round(
    reports.reduce((acc, r) => acc + (r.priority?.score || 0), 0) / total
  );

  const resolutionRate = Math.round((statusCounts.Resolved / total) * 100);

  return (
    <section aria-labelledby="insights-heading">
      <header style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 id="insights-heading">Impact & Prioritization Insights</h2>
        <p style={{ margin: 0, maxWidth: 680 }}>
          CivicSignal operates under radical transparency. Here you can inspect aggregate community
          metrics, status resolution progress, and the exact mathematical formulas governing the
          priority scoring engine.
        </p>
      </header>

      {/* Top summary cards */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">Average Score</span>
            <div className="metric-icon-box">
              <Scale size={16} />
            </div>
          </div>
          <div className="metric-value">{avgScore}</div>
          <p className="metric-subtext">Community severity index (0-100)</p>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-label">Resolution Rate</span>
            <div className="metric-icon-box">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="metric-value">{resolutionRate}%</div>
          <p className="metric-subtext">{statusCounts.Resolved} of {total} issues resolved</p>
        </div>

        <div className="metric-card highlight-urgent">
          <div className="metric-card-header">
            <span className="metric-label">Critical / Urgent</span>
            <div className="metric-icon-box">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="metric-value">{tierCounts.urgent}</div>
          <p className="metric-subtext">Immediate safety risk flags</p>
        </div>

        <div className="metric-card highlight-progress">
          <div className="metric-card-header">
            <span className="metric-label">Active Workflows</span>
            <div className="metric-icon-box">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="metric-value">{statusCounts['In Progress'] + statusCounts['In Review']}</div>
          <p className="metric-subtext">Currently assigned or in triage</p>
        </div>
      </div>

      {/* Distributions 2-col */}
      <div className="insights-grid-2col">
        {/* Priority Tiers */}
        <div className="insights-card">
          <h3 className="insights-card-title">Priority Classification Distribution</h3>
          <p className="insights-card-desc">
            Deterministic triage buckets derived from explicit safety, urgency, and exposure factors.
          </p>

          <div className="bar-distribution-item">
            <div className="bar-distribution-header">
              <span className="bar-distribution-label" style={{ color: 'var(--priority-urgent-text)' }}>
                Urgent / Critical (80 - 100 pts)
              </span>
              <span className="bar-distribution-counts">{tierCounts.urgent} reports</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(tierCounts.urgent / total) * 100}%`,
                  backgroundColor: 'var(--priority-urgent-dot)',
                }}
              />
            </div>
          </div>

          <div className="bar-distribution-item">
            <div className="bar-distribution-header">
              <span className="bar-distribution-label" style={{ color: 'var(--priority-high-text)' }}>
                High Priority (60 - 79 pts)
              </span>
              <span className="bar-distribution-counts">{tierCounts.high} reports</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(tierCounts.high / total) * 100}%`,
                  backgroundColor: 'var(--priority-high-dot)',
                }}
              />
            </div>
          </div>

          <div className="bar-distribution-item">
            <div className="bar-distribution-header">
              <span className="bar-distribution-label" style={{ color: 'var(--priority-medium-text)' }}>
                Medium Priority (35 - 59 pts)
              </span>
              <span className="bar-distribution-counts">{tierCounts.medium} reports</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(tierCounts.medium / total) * 100}%`,
                  backgroundColor: 'var(--priority-medium-dot)',
                }}
              />
            </div>
          </div>

          <div className="bar-distribution-item">
            <div className="bar-distribution-header">
              <span className="bar-distribution-label" style={{ color: 'var(--priority-low-text)' }}>
                Low Priority (0 - 34 pts)
              </span>
              <span className="bar-distribution-counts">{tierCounts.low} reports</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(tierCounts.low / total) * 100}%`,
                  backgroundColor: 'var(--priority-low-dot)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="insights-card">
          <h3 className="insights-card-title">Reports by Infrastructure Category</h3>
          <p className="insights-card-desc">
            Distribution of intake across civil infrastructure and neighborhood service areas.
          </p>

          {categoryCounts.map((cat) => (
            <div key={cat.name} className="bar-distribution-item">
              <div className="bar-distribution-header">
                <span className="bar-distribution-label">{cat.name}</span>
                <span className="bar-distribution-counts">{cat.count} reports</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${total > 0 ? (cat.count / total) * 100 : 0}%`,
                    backgroundColor: 'var(--green-700)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithmic Explainability & Specification Section */}
      <article
        className="insights-card"
        style={{ marginBottom: '2rem' }}
        aria-labelledby="algo-spec-title"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={22} style={{ color: 'var(--green-700)' }} />
          <h3 id="algo-spec-title" className="insights-card-title" style={{ margin: 0 }}>
            Priority Engine Scoring Specification & Formula
          </h3>
        </div>
        <p className="insights-card-desc">
          Unlike proprietary algorithmic black-boxes, CivicSignal scores are 100% deterministic,
          transparent, and calculated entirely on the client. Every point is accounted for below.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="algo-spec-table" aria-label="Priority engine factor weight specification">
            <thead>
              <tr>
                <th scope="col">Factor Domain</th>
                <th scope="col">Max Weight</th>
                <th scope="col">Evaluated Criteria</th>
                <th scope="col">Municipal Rationale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Safety Risk</th>
                <td className="weight-col">40 pts</td>
                <td>
                  Severe bodily hazard (+40) • Pedestrian/cyclist hazard (+25) • Property/minor (+12) •
                  None (+0)
                </td>
                <td>Mitigates immediate physical injury, life-safety emergencies, and liability hazards.</td>
              </tr>
              <tr>
                <th scope="row">Urgency & Deterioration</th>
                <td className="weight-col">25 pts</td>
                <td>
                  Immediate / acute exposure (+25) • Progressive degradation (+15) • Routine (+5)
                </td>
                <td>Prevents small defects from compounding under heavy rain, freezing, or high traffic.</td>
              </tr>
              <tr>
                <th scope="row">Community Scope & Exposure</th>
                <td className="weight-col">25 pts</td>
                <td>
                  School zone / arterial hub (+25) • Neighborhood corridor (+15) • Isolated lane (+5)
                </td>
                <td>Prioritizes vulnerable pedestrian corridors, schools, and transit choke points.</td>
              </tr>
              <tr>
                <th scope="row">Category Baseline</th>
                <td className="weight-col">10 pts</td>
                <td>
                  Public Safety (+10) • Accessibility (+10) • Roads (+7) • Environment (+7) • Waste (+6)
                </td>
                <td>Ensures ADA equity and life-safety compliance baseline.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderLeft: '4px solid var(--green-700)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}
        >
          <strong>Ethical & Algorithmic Governance Notice:</strong>
          <div>
            CivicSignal priority calculations do not ingest geographic wealth indices, resident demographics,
            or historical reporting frequency biases. The scoring engine evaluates purely physical hazard,
            rate of deterioration, and transit vulnerability. This score serves strictly as a decision-support
            estimate to facilitate transparent community triage, and does not replace official municipal determinations.
          </div>
        </div>
      </article>
    </section>
  );
}
