import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import MetricsOverview from './components/MetricsOverview';
import ReportsList from './components/ReportsList';
import ReportForm from './components/ReportForm';
import InteractiveMap from './components/InteractiveMap';
import InsightsView from './components/InsightsView';
import ReportDetailModal from './components/ReportDetailModal';
import {
  getStoredReports,
  addReport,
  updateReportStatus,
  supportReport,
  assignReport,
  updateReportResolution,
  resetToDefaultReports,
} from './utils/storage';
import { Menu, ShieldCheck, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'map' | 'submit' | 'reports' | 'insights'
  const [reports, setReports] = useState(getStoredReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('CITIZEN'); // 'CITIZEN' | 'ADMIN' | 'RESOLVER'

  // Initial filter presets when navigating from metric cards
  const [reportFilterPreset, setReportFilterPreset] = useState({
    status: 'ALL',
    priority: 'ALL',
  });

  // Update URL hash / view navigation
  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search input handler
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Perform search (from header enter or search action)
  const handlePerformSearch = () => {
    setCurrentView('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create new report with persistence validation
  const handleCreateReport = (reportData) => {
    try {
      const { newReport, updatedReports } = addReport(reportData);
      setReports(updatedReports);
      return { success: true, report: newReport };
    } catch (err) {
      console.error('Failed to create and persist report:', err);
      return {
        success: false,
        error: err?.message || 'Storage error occurred. Report could not be saved.',
        isQuota: err?.name === 'StorageQuotaError',
      };
    }
  };

  // Update report status
  const handleUpdateStatus = (id, newStatus, note = '') => {
    const updated = updateReportStatus(id, newStatus, note);
    setReports(updated);
    if (selectedReportForModal && selectedReportForModal.id === id) {
      const refreshed = updated.find((r) => r.id === id);
      setSelectedReportForModal(refreshed);
    }
  };

  // Endorse report ("I have this problem too") with unique local user tracking
  const handleSupportReport = (id) => {
    const { reports: updated } = supportReport(id, 'citizen-local');
    setReports(updated);
    if (selectedReportForModal && selectedReportForModal.id === id) {
      const refreshed = updated.find((r) => r.id === id);
      setSelectedReportForModal(refreshed);
    }
  };

  // Administrator assignment workflow
  const handleAssignReport = (id, details) => {
    const updated = assignReport(id, details);
    setReports(updated);
    if (selectedReportForModal && selectedReportForModal.id === id) {
      const refreshed = updated.find((r) => r.id === id);
      setSelectedReportForModal(refreshed);
    }
  };

  // Resolver resolution workflow
  const handleResolveReport = (id, details) => {
    const updated = updateReportResolution(id, details);
    setReports(updated);
    if (selectedReportForModal && selectedReportForModal.id === id) {
      const refreshed = updated.find((r) => r.id === id);
      setSelectedReportForModal(refreshed);
    }
  };

  // Reset to sample data
  const handleResetDemoData = () => {
    const confirmed = window.confirm(
      'Reset all data back to the default simulated demonstration dataset? Any custom reports created in this session will be replaced.'
    );
    if (confirmed) {
      const defaults = resetToDefaultReports();
      setReports(defaults);
      setSelectedReportForModal(null);
      setSearchQuery('');
      setReportFilterPreset({ status: 'ALL', priority: 'ALL' });
      setCurrentView('overview');
    }
  };

  // Metric card click-through
  const handleFilterByMetric = (metricType) => {
    if (metricType === 'all') {
      setReportFilterPreset({ status: 'ALL', priority: 'ALL' });
    } else if (metricType === 'urgent_high') {
      setReportFilterPreset({ status: 'ALL', priority: 'urgent_high' });
    } else if (metricType === 'in_progress') {
      setReportFilterPreset({ status: 'In Progress', priority: 'ALL' });
    } else if (metricType === 'resolved') {
      setReportFilterPreset({ status: 'Resolved', priority: 'ALL' });
    }
    setCurrentView('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate role-specific queue counts
  const triageQueueCount = reports.filter(
    (r) => r.status === 'Open' || r.status === 'In Review'
  ).length;

  const activeWorkOrdersCount = reports.filter(
    (r) => r.status === 'Assigned' || r.status === 'In Progress'
  ).length;

  // Role change handler that coordinates default view and filter presets
  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
    if (newRole === 'RESOLVER') {
      setReportFilterPreset({ status: 'Assigned', priority: 'ALL' });
    } else if (newRole === 'ADMIN') {
      setReportFilterPreset({ status: 'Open', priority: 'ALL' });
    } else {
      setReportFilterPreset({ status: 'ALL', priority: 'ALL' });
    }
  };

  return (
    <div className="app-container">
      {/* Keyboard Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile Top Header */}
      <div className="mobile-topbar" role="region" aria-label="Mobile Header">
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open primary navigation menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-logo-icon" style={{ width: 28, height: 28 }} aria-hidden="true">
            <ShieldCheck size={16} />
          </div>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--green-900)' }}>
            CivicSignal
          </span>
        </div>

        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => handleNavigate('submit')}
          aria-label="Quick report issue"
        >
          <PlusCircle size={15} />
        </button>
      </div>

      {/* Main Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        reportsCount={reports.length}
        onResetDemoData={handleResetDemoData}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userRole={userRole}
        activeWorkOrdersCount={activeWorkOrdersCount}
        triageQueueCount={triageQueueCount}
      />

      {/* Main Content Area */}
      <main id="main-content" className="app-main" tabIndex="-1">
        <div className="content-wrapper">
          {/* Dashboard Header is persistent for contextual overview and quick search */}
          <DashboardHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onNavigateToSubmit={() => handleNavigate('submit')}
            onPerformSearch={handlePerformSearch}
            userRole={userRole}
            onRoleChange={handleRoleChange}
          />

          {/* VIEW: OVERVIEW */}
          {currentView === 'overview' && (
            <div>
              <MetricsOverview
                reports={reports}
                onFilterByMetric={handleFilterByMetric}
                userRole={userRole}
              />

              {/* Recent prioritized reports slice */}
              <div style={{ marginTop: '2rem' }}>
                <ReportsList
                  reports={reports}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  initialPriority="ALL"
                  initialStatus="ALL"
                  onSelectReport={(rep) => setSelectedReportForModal(rep)}
                  onUpvote={handleSupportReport}
                  onUpdateStatus={handleUpdateStatus}
                  onNavigateToSubmit={() => handleNavigate('submit')}
                />
              </div>
            </div>
          )}

          {/* VIEW: INTERACTIVE OPERATIONS MAP */}
          {currentView === 'map' && (
            <InteractiveMap
              reports={reports}
              onSelectReport={(rep) => setSelectedReportForModal(rep)}
              onNavigateToSubmit={() => handleNavigate('submit')}
            />
          )}

          {/* VIEW: REPORT AN ISSUE */}
          {currentView === 'submit' && (
            <ReportForm
              onSubmitSuccess={handleCreateReport}
              onNavigateToReports={() => handleNavigate('reports')}
            />
          )}

          {/* VIEW: COMMUNITY REPORTS / WORK ORDERS */}
          {currentView === 'reports' && (
            <ReportsList
              key={`${reportFilterPreset.status}-${reportFilterPreset.priority}`}
              reports={reports}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              initialStatus={reportFilterPreset.status}
              initialPriority={reportFilterPreset.priority}
              onSelectReport={(rep) => setSelectedReportForModal(rep)}
              onUpvote={handleSupportReport}
              onUpdateStatus={handleUpdateStatus}
              onNavigateToSubmit={() => handleNavigate('submit')}
            />
          )}

          {/* VIEW: IMPACT & INSIGHTS */}
          {currentView === 'insights' && (
            <InsightsView reports={reports} />
          )}
        </div>
      </main>

      {/* Inspect Priority & Details Modal */}
      {selectedReportForModal && (
        <ReportDetailModal
          report={selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpvote={handleSupportReport}
          onAssignReport={handleAssignReport}
          onResolveReport={handleResolveReport}
          userRole={userRole}
        />
      )}
    </div>
  );
}
