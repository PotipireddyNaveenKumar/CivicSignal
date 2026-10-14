import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  BarChart3,
  RotateCcw,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  onNavigate,
  reportsCount,
  onResetDemoData,
  mobileOpen,
  onCloseMobile,
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'submit',
      label: 'Report an Issue',
      icon: PlusCircle,
    },
    {
      id: 'map',
      label: 'Operations Map',
      icon: MapPin,
    },
    {
      id: 'reports',
      label: 'Community Reports',
      icon: FileText,
      badge: reportsCount,
    },
    {
      id: 'insights',
      label: 'Impact & Insights',
      icon: BarChart3,
    },
  ];

  const handleNavClick = (viewId) => {
    onNavigate(viewId);
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Primary Navigation"
    >
      <div className="sidebar-brand-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href="#overview"
            className="brand-link"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('overview');
            }}
          >
            <div className="brand-logo-icon" aria-hidden="true">
              <ShieldCheck size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">CivicSignal</span>
              <span className="brand-tagline">Transparent Civic Triage</span>
            </div>
          </a>
          {mobileOpen && (
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-btn-inner">
                <Icon className="nav-icon" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="nav-badge" aria-label={`${item.badge} reports`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="demo-dataset-notice">
          <strong>Demonstration Environment</strong>
          Client-side local persistence. Not connected to municipal 911 or dispatch.
        </div>
        <button
          type="button"
          className="btn-reset-demo"
          onClick={onResetDemoData}
          title="Restore original simulated demonstration records"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
}
