import { PlusCircle, Search, X, UserCheck, Shield } from 'lucide-react';

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  onNavigateToSubmit,
  onPerformSearch,
  userRole = 'CITIZEN',
  onRoleChange,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onPerformSearch) {
      onPerformSearch();
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Municipal Administrator';
      case 'RESOLVER':
        return 'Authorized Field Resolver';
      case 'CITIZEN':
      default:
        return 'Community Member (Citizen)';
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
          {/* Role Simulation Switcher */}
          <div className="role-switcher-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <Shield size={13} style={{ color: 'var(--green-700)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--green-950)' }}>
                Active Session Role
              </span>
            </div>
            <select
              className="role-select"
              value={userRole}
              onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
              aria-label="Switch active demonstration user role"
            >
              <option value="CITIZEN">👤 Community Member</option>
              <option value="ADMIN">🏛️ Municipal Administrator</option>
              <option value="RESOLVER">🔧 Field Resolver</option>
            </select>
          </div>

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

      {/* Role Notice Banner */}
      <div className="role-notice-banner">
        <UserCheck size={14} style={{ flexShrink: 0 }} />
        <span>
          <strong>Operating as: {getRoleLabel(userRole)}.</strong> Role-based triage permissions active. (Prototype simulation — production deployments require server-verified tokens).
        </span>
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
