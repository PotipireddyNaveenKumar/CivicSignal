import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import MetricsOverview from './components/MetricsOverview';
import ReportsList from './components/ReportsList';
import ReportForm from './components/ReportForm';
import InsightsView from './components/InsightsView';
import ReportDetailModal from './components/ReportDetailModal';
import {
  getStoredReports,
  addReport,
  updateReportStatus,
  toggleReportUpvote,
  resetToDefaultReports,
} from './utils/storage';
import { Menu, ShieldCheck, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'submit' | 'reports' | 'insights'
  const [reports, setReports] = useState(getStoredReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Create new report
  const handleCreateReport = (reportData) => {
    const { newReport, updatedReports } = addReport(reportData);
    setReports(updatedReports);
    return newReport;
  };

  // Update report status
  const handleUpdateStatus = (id, newStatus) => {
    const updated = updateReportStatus(id, newStatus);
    setReports(updated);
    if (selectedReportForModal && selectedReportForModal.id === id) {
      const refreshed = updated.find((r) => r.id === id);
      setSelectedReportForModal(refreshed);
    }
  };

  // Upvote report
  const handleUpvote = (id) => {
    const updated = toggleReportUpvote(id);
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
          />

          {/* VIEW: OVERVIEW */}
          {currentView === 'overview' && (
            <div>
              <MetricsOverview
                reports={reports}
                onFilterByMetric={handleFilterByMetric}
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
                  onUpvote={handleUpvote}
                  onUpdateStatus={handleUpdateStatus}
                  onNavigateToSubmit={() => handleNavigate('submit')}
                />
              </div>
            </div>
          )}

          {/* VIEW: REPORT AN ISSUE */}
          {currentView === 'submit' && (
            <ReportForm
              onSubmitSuccess={handleCreateReport}
              onNavigateToReports={() => handleNavigate('reports')}
            />
          )}

          {/* VIEW: COMMUNITY REPORTS */}
          {currentView === 'reports' && (
            <ReportsList
              reports={reports}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              initialStatus={reportFilterPreset.status}
              initialPriority={reportFilterPreset.priority}
              onSelectReport={(rep) => setSelectedReportForModal(rep)}
              onUpvote={handleUpvote}
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
          onUpvote={handleUpvote}
        />
      )}
    </div>
  );
}
