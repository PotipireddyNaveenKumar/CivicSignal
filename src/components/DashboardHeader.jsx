import { PlusCircle, Search, X } from 'lucide-react';

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  onNavigateToSubmit,
  onPerformSearch,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onPerformSearch) {
      onPerformSearch();
    }
  };

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-top-row">
        <div className="header-title-group">
          <h1>Your community, better connected.</h1>
          <p className="header-description">
            CivicSignal empowers residents and local response teams by translating everyday
            neighborhood problems into transparent, prioritized, and mathematically inspectable reports.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToSubmit}
            id="btn-header-report"
          >
            <PlusCircle size={18} aria-hidden="true" />
            <span>Report an Issue</span>
          </button>
        </div>
      </div>

      <form className="header-search-bar" onSubmit={handleSubmit} role="search">
        <Search className="search-icon-inside" aria-hidden="true" />
        <label htmlFor="dashboard-search-input" className="sr-only" style={{ display: 'none' }}>
          Search community reports
        </label>
        <input
          id="dashboard-search-input"
          type="search"
          className="search-input"
          placeholder="Search reports by title, street location, or category..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search community reports by title, location, or keyword"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear search input"
          >
            <X size={16} />
          </button>
        )}
      </form>
    </header>
  );
}
