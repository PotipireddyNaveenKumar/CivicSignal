import { useState, useMemo } from 'react';
import {
  Filter,
  ArrowUpDown,
  MapPin,
  Calendar,
  ThumbsUp,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { CATEGORIES } from '../utils/priorityEngine';

export default function ReportsList({
  reports = [],
  searchQuery = '',
  onSearchChange,
  initialCategory = 'ALL',
  initialStatus = 'ALL',
  initialPriority = 'ALL',
  onSelectReport,
  onUpvote,
  onNavigateToSubmit,
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedPriority, setSelectedPriority] = useState(initialPriority);
  const [sortBy, setSortBy] = useState('priority_desc');

  // Filter and sort computation
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'ALL') {
      if (selectedPriority === 'urgent_high') {
        result = result.filter((r) => {
          const t = r.priority?.tierKey;
          return t === 'urgent' || t === 'high';
        });
      } else {
        result = result.filter((r) => r.priority?.tierKey === selectedPriority);
      }
    }

    // Sorting
    result.sort((a, b) => {
      const scoreA = a.priority?.score ?? 0;
      const scoreB = b.priority?.score ?? 0;
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();

      switch (sortBy) {
        case 'priority_desc':
          return scoreB - scoreA;
        case 'priority_asc':
          return scoreA - scoreB;
        case 'date_desc':
          return dateB - dateA;
        case 'date_asc':
          return dateA - dateB;
        default:
          return scoreB - scoreA;
      }
    });

    return result;
  }, [reports, searchQuery, selectedCategory, selectedStatus, selectedPriority, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    sortBy !== 'priority_desc';

  const handleClearFilters = () => {
    if (onSearchChange) onSearchChange('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSortBy('priority_desc');
  };

  return (
    <section aria-labelledby="community-reports-heading">
      <div className="reports-section-header">
        <div>
          <h2 id="community-reports-heading">Community Reports</h2>
          <p style={{ margin: 0, fontSize: '0.9375rem' }}>
            Showing {filteredAndSortedReports.length} of {reports.length} reports prioritized by community need
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={onNavigateToSubmit}
        >
          <PlusCircle size={15} aria-hidden="true" />
          <span>New Report</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="reports-filter-bar">
        <div className="filter-row-top">
          {/* Category Dropdown */}
          <div className="filter-group">
            <label htmlFor="filter-cat-select" className="filter-label">
              Category:
            </label>
            <select
              id="filter-cat-select"
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="filter-group">
            <label htmlFor="filter-status-select" className="filter-label">
              Status:
            </label>
            <select
              id="filter-status-select"
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Tier Filter */}
          <div className="filter-group">
            <label htmlFor="filter-priority-select" className="filter-label">
              Priority:
            </label>
            <select
              id="filter-priority-select"
              className="filter-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="ALL">All Priority Tiers</option>
              <option value="urgent">Urgent / Critical (80-100)</option>
              <option value="high">High Priority (60-79)</option>
              <option value="medium">Medium Priority (35-59)</option>
              <option value="low">Low Priority (0-34)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="filter-group" style={{ marginLeft: 'auto' }}>
            <label htmlFor="filter-sort-select" className="filter-label">
              <ArrowUpDown size={14} style={{ display: 'inline', marginRight: 4 }} />
              Sort:
            </label>
            <select
              id="filter-sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority_desc">Highest Priority First</option>
              <option value="priority_asc">Lowest Priority First</option>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Reset all active search and filter criteria"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports List Cards */}
      {filteredAndSortedReports.length === 0 ? (
        <div className="empty-state-box" role="status">
          <Filter className="empty-state-icon" aria-hidden="true" />
          <h3>No matching reports found</h3>
          <p>
            {hasActiveFilters
              ? 'No issues match your current search and filter criteria. Try adjusting your filters or resetting them.'
              : 'No civic reports are currently registered. Be the first to report an issue in your neighborhood.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={onNavigateToSubmit}
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>File First Report</span>
            </button>
          )}
        </div>
      ) : (
        <div className="reports-list" role="feed" aria-label="Community reports feed">
          {filteredAndSortedReports.map((report) => {
            const priority = report.priority || {};
            const formattedDate = new Date(report.submittedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article
                key={report.id}
                className="report-card"
                aria-labelledby={`report-title-${report.id}`}
              >
                <div className="report-card-meta">
                  <div className="report-card-tags">
                    <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
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
                  </div>

                  <span className={`priority-pill priority-pill-${priority.tierKey || 'low'}`}>
                    <span className="priority-dot" />
                    {priority.tierLabel} • Score: {priority.score}
                  </span>
                </div>

                <div>
                  <h3 id={`report-title-${report.id}`} className="report-card-title">
                    {report.title}
                  </h3>
                  <div className="report-card-location">
                    <MapPin size={14} aria-hidden="true" />
                    <span>{report.location}</span>
                  </div>
                  <p className="report-card-desc">{report.description}</p>
                </div>

                {/* Priority Factor Breakdown Preview */}
                <div className="report-priority-bar-preview">
                  <div className="priority-score-badge">
                    {priority.score} <span>/ 100</span>
                  </div>
                  <div className="priority-factor-breakdown-inline">
                    <span className="priority-factor-item">
                      Safety: <strong>+{priority.factors?.[0]?.score || 0}</strong>
                    </span>
                    <span>•</span>
                    <span className="priority-factor-item">
                      Urgency: <strong>+{priority.factors?.[1]?.score || 0}</strong>
                    </span>
                    <span>•</span>
                    <span className="priority-factor-item">
                      Scope: <strong>+{priority.factors?.[2]?.score || 0}</strong>
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {priority.synthesizedReason}
                    </span>
                  </div>
                </div>

                <div className="report-card-footer">
                  <div className="report-card-footer-left">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} aria-hidden="true" />
                      {formattedDate}
                    </span>
                    {report.isDemonstration && (
                      <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                        Simulated Record
                      </span>
                    )}
                  </div>

                  <div className="report-card-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onUpvote(report.id)}
                      aria-label={`Endorse report ${report.id}. Current endorsements: ${report.upvotes || 0}`}
                    >
                      <ThumbsUp size={13} aria-hidden="true" />
                      <span>{report.upvotes || 0}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => onSelectReport(report)}
                      aria-label={`Inspect scoring and full details for ${report.title}`}
                    >
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>Inspect Priority</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
