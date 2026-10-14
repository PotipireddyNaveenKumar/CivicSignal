import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  BarChart3,
  RotateCcw,
  X,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Wrench,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  onNavigate,
  reportsCount,
  onResetDemoData,
  mobileOpen,
  onCloseMobile,
  userRole = 'CITIZEN',
  activeWorkOrdersCount = 0,
  triageQueueCount = 0,
}) {
  // Build role-specific navigation configuration
  let navItems;

  if (userRole === 'ADMIN') {
    navItems = [
      {
        id: 'overview',
        label: 'Triage Overview',
        icon: LayoutDashboard,
      },
      {
        id: 'map',
        label: 'Operations Map',
        icon: MapPin,
      },
      {
        id: 'reports',
        label: 'Dispatch Queue',
        icon: Sliders,
        badge: triageQueueCount,
      },
      {
        id: 'submit',
        label: 'Log Municipal Incident',
        icon: PlusCircle,
      },
      {
        id: 'insights',
        label: 'Civic Analytics',
        icon: BarChart3,
      },
    ];
  } else if (userRole === 'RESOLVER') {
    navItems = [
      {
        id: 'overview',
        label: 'Field Overview',
        icon: LayoutDashboard,
      },
      {
        id: 'reports',
        label: 'Assigned Work Orders',
        icon: Wrench,
        badge: activeWorkOrdersCount,
      },
      {
        id: 'map',
        label: 'Incident Map',
        icon: MapPin,
      },
      {
        id: 'insights',
        label: 'Resolution Metrics',
        icon: CheckCircle2,
      },
      {
        id: 'submit',
        label: 'Report Field Hazard',
        icon: PlusCircle,
      },
    ];
  } else {
    // CITIZEN (default)
    navItems = [
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
  }

  const handleNavClick = (viewId) => {
    onNavigate(viewId);
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const roleLabels = {
    CITIZEN: { name: 'Citizen Portal', color: '#10b981', desc: 'Public community reporting & tracking' },
    ADMIN: { name: 'Municipal Admin', color: '#3b82f6', desc: 'Triage, assignment & municipal oversight' },
    RESOLVER: { name: 'Field Resolver', color: '#f59e0b', desc: 'Work order execution & status updates' },
  };

  const activeRole = roleLabels[userRole] || roleLabels.CITIZEN;

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

        {/* Role context indicator badge */}
        <div
          style={{
            marginTop: '0.85rem',
            padding: '0.45rem 0.65rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: activeRole.color,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
              {activeRole.name}
            </span>
            <span style={{ fontSize: '0.675rem', color: '#94a3b8', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeRole.desc}
            </span>
          </div>
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
                <span className="nav-badge" aria-label={`${item.badge} records`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="demo-dataset-notice">
          <strong>Andhra Pradesh Region</strong>
          Client-side local persistence with state-machine audit trails.
        </div>
        <button
          type="button"
          className="btn-reset-demo"
          onClick={onResetDemoData}
          title="Restore original simulated demonstration records"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset AP Demo Data</span>
        </button>
      </div>
    </aside>
  );
}
