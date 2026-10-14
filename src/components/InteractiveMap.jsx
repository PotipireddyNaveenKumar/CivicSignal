import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Layers,
  ExternalLink,
  ShieldAlert,
  Users,
  Compass,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CATEGORIES } from '../utils/priorityEngine';

// Custom SVG marker factory for Leaflet
function createMarkerIcon(priorityTierKey, isResolved) {
  let color = '#ca8a04'; // Medium
  let label = 'M';

  if (isResolved) {
    color = '#4b5563'; // Slate
    label = '✓';
  } else if (priorityTierKey === 'urgent') {
    color = '#dc2626'; // Red
    label = '!';
  } else if (priorityTierKey === 'high') {
    color = '#ea580c'; // Orange
    label = 'H';
  } else if (priorityTierKey === 'low') {
    color = '#16a34a'; // Green
    label = 'L';
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14 24.5 15.1 25.6.5.5 1.3.5 1.8 0C18 40.5 32 26.5 32 16 32 7.16 24.84 0 16 0z" fill="${color}" filter="url(#shadow)" stroke="#ffffff" stroke-width="2"/>
      <circle cx="16" cy="15" r="7.5" fill="#ffffff" />
      <text x="16" y="19" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="${color}" text-anchor="middle">${label}</text>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

export default function InteractiveMap({ reports = [], onSelectReport, onNavigateToSubmit }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Map filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showUnmappedList, setShowUnmappedList] = useState(false);

  // Split reports into geocoded vs unmapped
  const { geocodedReports, unmappedReports } = useMemo(() => {
    const geocoded = [];
    const unmapped = [];

    reports.forEach((r) => {
      if (
        r.coordinates &&
        typeof r.coordinates.lat === 'number' &&
        typeof r.coordinates.lng === 'number' &&
        !isNaN(r.coordinates.lat) &&
        !isNaN(r.coordinates.lng)
      ) {
        geocoded.push(r);
      } else {
        unmapped.push(r);
      }
    });

    return { geocodedReports: geocoded, unmappedReports: unmapped };
  }, [reports]);

  // Filter geocoded reports
  const filteredReports = useMemo(() => {
    return geocodedReports.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      if (selectedPriority !== 'ALL') {
        const tier = r.priority?.tierKey;
        if (selectedPriority === 'urgent_high') {
          if (tier !== 'urgent' && tier !== 'high') return false;
        } else if (tier !== selectedPriority) {
          return false;
        }
      }
      return true;
    });
  }, [geocodedReports, selectedCategory, selectedStatus, selectedPriority]);

  // Selected report details for inspector side-panel
  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on Andhra Pradesh, India (Vijayawada-Guntur capital region)
    const defaultCenter = [16.5000, 80.6000];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filteredReports or selectedReportId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (filteredReports.length === 0) return;

    const bounds = L.latLngBounds();

    filteredReports.forEach((report) => {
      const { lat, lng } = report.coordinates;
      const isResolved = report.status === 'Resolved';
      const tierKey = report.priority?.tierKey || 'medium';
      const icon = createMarkerIcon(tierKey, isResolved);

      const marker = L.marker([lat, lng], { icon });

      // Rich popup content
      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 200px; max-width: 260px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: #15803d; letter-spacing: 0.5px;">${report.id}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: #f3f4f6; color: #374151;">${report.status}</span>
          </div>
          <div style="font-weight: 700; color: #111827; margin-bottom: 4px; font-size: 13px;">${report.title}</div>
          <div style="color: #4b5563; font-size: 11px; margin-bottom: 6px;">📍 ${report.location}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #1f2937;">Priority: ${report.priority?.score || 50}/100</span>
            <span style="font-size: 11px; color: #6b7280;">👥 ${report.supportCount || 1} supporters</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedReportId(report.id);
      });

      markersGroup.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredReports]);

  // Center on active report if selected
  const handleFocusReport = (report) => {
    setSelectedReportId(report.id);
    if (mapInstanceRef.current && report.coordinates) {
      mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 15, {
        animate: true,
      });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
  };

  return (
    <div className="map-view-container">
      {/* Map Control Header */}
      <div className="map-header-card">
        <div className="map-header-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Compass size={20} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--green-950)' }}>
                Interactive Municipal Operations Map
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Geographic triage visualization of community reported infrastructure issues.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="map-stat-badge">
              <span className="dot dot-green" />
              <span>{geocodedReports.length} Mapped Issues</span>
            </div>
            {unmappedReports.length > 0 && (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setShowUnmappedList(!showUnmappedList)}
                style={{ fontSize: '0.8rem' }}
              >
                <AlertTriangle size={13} style={{ color: 'var(--amber-700)' }} />
                <span>{unmappedReports.length} Pending Coordinates</span>
              </button>
            )}
            {onNavigateToSubmit && (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={onNavigateToSubmit}
                style={{ fontSize: '0.8rem' }}
              >
                + Add Geocoded Issue
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="map-filter-bar">
          <div className="filter-group">
            <label htmlFor="map-priority-select">
              <Filter size={13} /> Priority
            </label>
            <select
              id="map-priority-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent / Critical (80+)</option>
              <option value="high">High Priority (60-79)</option>
              <option value="urgent_high">Urgent & High</option>
              <option value="medium">Medium Priority (35-59)</option>
              <option value="low">Low Priority (&lt;35)</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="map-category-select">
              <Layers size={13} /> Category
            </label>
            <select
              id="map-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="map-status-select">Status</label>
            <select
              id="map-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select form-select-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={handleResetFilters}
              style={{ alignSelf: 'flex-end', height: 32 }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}

          {/* Marker Legend */}
          <div className="map-legend">
            <span className="legend-item"><span className="legend-dot dot-red" /> Urgent</span>
            <span className="legend-item"><span className="legend-dot dot-orange" /> High</span>
            <span className="legend-item"><span className="legend-dot dot-yellow" /> Medium</span>
            <span className="legend-item"><span className="legend-dot dot-green" /> Low</span>
            <span className="legend-item"><span className="legend-dot dot-gray" /> Resolved</span>
          </div>
        </div>
      </div>

      {/* Main Map Layout */}
      <div className="map-canvas-layout">
        {/* Leaflet DOM container */}
        <div className="map-wrapper">
          <div ref={mapContainerRef} className="leaflet-map-host" id="civic-operations-map" />

          {filteredReports.length === 0 && (
            <div className="map-empty-overlay">
              <ShieldAlert size={28} style={{ color: 'var(--amber-700)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No Reports Match Selected Map Filters</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0.75rem' }}>
                Adjust priority or category filters to see incidents in this municipal corridor.
              </p>
              <button type="button" className="btn-primary btn-sm" onClick={handleResetFilters}>
                Clear Map Filters
              </button>
            </div>
          )}
        </div>

        {/* Selected Incident Inspector Side-Panel */}
        {activeReport ? (
          <aside className="map-inspector-panel" aria-label="Incident Details">
            <div className="inspector-header">
              <div>
                <span className="report-id-chip">{activeReport.id}</span>
                <span className={`badge ${activeReport.priority?.badgeClass || 'badge-medium'}`} style={{ marginLeft: 6 }}>
                  {activeReport.priority?.tierLabel || 'Medium Priority'} ({activeReport.priority?.score || 50}/100)
                </span>
              </div>
              <button
                type="button"
                className="btn-close-sm"
                onClick={() => setSelectedReportId(null)}
                aria-label="Close inspector panel"
              >
                ✕
              </button>
            </div>

            <h3 className="inspector-title">{activeReport.title}</h3>

            <div className="inspector-meta-row">
              <span className="meta-tag">📂 {activeReport.category}</span>
              <span className="meta-tag">🚦 {activeReport.status}</span>
              <span className="meta-tag">
                <Users size={12} style={{ display: 'inline', marginRight: 3 }} />
                {activeReport.supportCount || activeReport.upvotes || 1} Supporters
              </span>
            </div>

            <div className="inspector-field">
              <div className="inspector-label">Reported Location</div>
              <div className="inspector-value">📍 {activeReport.location}</div>
              {activeReport.coordinates && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Coordinates: {activeReport.coordinates.lat.toFixed(4)}, {activeReport.coordinates.lng.toFixed(4)}
                </div>
              )}
            </div>

            <div className="inspector-field">
              <div className="inspector-label">Description</div>
              <p className="inspector-description">{activeReport.description}</p>
            </div>

            {activeReport.assignedTo && (
              <div className="inspector-field" style={{ background: 'var(--sand-50)', padding: '0.5rem', borderRadius: 6 }}>
                <div className="inspector-label">Assigned Field Unit</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--green-950)' }}>
                  {activeReport.assignedTo.department} — {activeReport.assignedTo.resolverName}
                </div>
              </div>
            )}

            <div className="inspector-actions">
              <button
                type="button"
                className="btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onSelectReport && onSelectReport(activeReport)}
              >
                <ExternalLink size={14} /> Open Full Assessment & Workflow
              </button>
            </div>
          </aside>
        ) : (
          <aside className="map-inspector-panel inspector-placeholder">
            <MapPin size={32} style={{ color: 'var(--green-600)', marginBottom: '0.5rem', opacity: 0.8 }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--green-950)' }}>Select an Incident Pin</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 1rem', textAlign: 'center' }}>
              Click any marker on the map to review urgency details, citizen confirmations, and dispatch assignment.
            </p>
            <div className="quick-pins-list">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Active Issues ({filteredReports.length})
              </div>
              {filteredReports.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="quick-pin-item"
                  onClick={() => handleFocusReport(r)}
                >
                  <span className={`dot dot-${r.priority?.tierKey === 'urgent' ? 'red' : r.priority?.tierKey === 'high' ? 'orange' : 'green'}`} />
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-800)' }}>
                    {r.priority?.score}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Drawer for Reports Pending Coordinates */}
      {showUnmappedList && unmappedReports.length > 0 && (
        <div className="unmapped-drawer">
          <div className="unmapped-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber-700)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Reports Pending GPS Coordinates ({unmappedReports.length})
              </span>
            </div>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setShowUnmappedList(false)}
            >
              Hide List
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0.75rem' }}>
            These issues were logged with a street address or descriptive location but have not been assigned precise coordinates.
          </p>
          <div className="unmapped-grid">
            {unmappedReports.map((r) => (
              <div key={r.id} className="unmapped-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--green-900)' }}>{r.id}</span>
                  <span className={`badge ${r.priority?.badgeClass || 'badge-medium'}`} style={{ fontSize: '0.7rem' }}>
                    Score: {r.priority?.score || 50}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📍 {r.location}</div>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  style={{ marginTop: 6, width: '100%', fontSize: '0.75rem', padding: '3px 8px' }}
                  onClick={() => onSelectReport && onSelectReport(r)}
                >
                  Inspect Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
