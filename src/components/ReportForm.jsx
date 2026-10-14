import { useState, useId, useRef } from 'react';
import {
  CATEGORIES,
  SAFETY_RISK_OPTIONS,
  URGENCY_OPTIONS,
  COMMUNITY_IMPACT_OPTIONS,
  calculatePriority,
} from '../utils/priorityEngine';
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export default function ReportForm({ onSubmitSuccess, onNavigateToReports }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [safetyRiskId, setSafetyRiskId] = useState('moderate');
  const [urgencyId, setUrgencyId] = useState('progressive');
  const [communityImpactId, setCommunityImpactId] = useState('neighborhood');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoName, setPhotoName] = useState('');

  // Validation state
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Accessible IDs
  const titleId = useId();
  const categoryId = useId();
  const locationId = useId();
  const descriptionId = useId();

  // Dynamic live score evaluation
  const livePriority = calculatePriority({
    category,
    safetyRiskId,
    urgencyId,
    communityImpactId,
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Attachment size must be under 5MB.',
        }));
        return;
      }
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.photo;
        return copy;
      });
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Issue title is required.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title should be at least 5 characters long.';
    }

    if (!category) {
      newErrors.category = 'Please select a relevant category.';
    }

    if (!location.trim()) {
      newErrors.location = 'Specific location or intersection is required.';
    } else if (location.trim().length < 4) {
      newErrors.location = 'Please provide a clearer location description.';
    }

    if (!description.trim()) {
      newErrors.description = 'A detailed description is required.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Please provide at least 15 characters describing the condition.';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const formErrors = validate();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Focus first error field
      if (formErrors.title && titleInputRef.current) {
        titleInputRef.current.focus();
      }
      return;
    }

    const reportPayload = {
      title,
      category,
      location,
      description,
      safetyRiskId,
      urgencyId,
      communityImpactId,
      photoUrl: photoPreview,
    };

    const created = onSubmitSuccess(reportPayload);
    setSubmittedReport(created);
  };

  const handleResetForm = () => {
    setTitle('');
    setCategory('Roads');
    setLocation('');
    setDescription('');
    setSafetyRiskId('moderate');
    setUrgencyId('progressive');
    setCommunityImpactId('neighborhood');
    setPhotoPreview(null);
    setPhotoName('');
    setErrors({});
    setHasAttemptedSubmit(false);
    setSubmittedReport(null);
  };

  // If successfully submitted, display receipt screen
  if (submittedReport) {
    return (
      <section className="form-main-card" aria-labelledby="receipt-title">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--green-50)',
              color: 'var(--green-700)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 id="receipt-title" style={{ marginBottom: '0.5rem' }}>
            Report Successfully Filed
          </h2>
          <p style={{ maxWidth: 520, margin: '0 auto 1.5rem auto' }}>
            Your community issue has been assigned identifier{' '}
            <strong className="mono">{submittedReport.id}</strong> and evaluated by the
            deterministic Priority Engine.
          </p>

          <div
            style={{
              maxWidth: 480,
              margin: '0 auto 2rem auto',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status</span>
              <span className="status-pill status-pill-open">Open</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Category</span>
              <span style={{ fontWeight: 600 }}>{submittedReport.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Priority Score</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {submittedReport.priority?.score} / 100 ({submittedReport.priority?.tierLabel})
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              <strong>Triage Rationale:</strong> {submittedReport.priority?.synthesizedReason}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onNavigateToReports}
            >
              <span>View in Community Reports</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetForm}
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="form-page-layout">
      {/* Primary Form */}
      <div className="form-main-card">
        <header style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2>Report an Issue</h2>
          <p style={{ margin: 0 }}>
            Submit an observed public hazard or neighborhood repair need. Your answers
            inform the transparent client-side priority score below.
          </p>
        </header>

        {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
          <div
            role="alert"
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--priority-urgent-bg)',
              color: 'var(--priority-urgent-text)',
              border: '1px solid var(--priority-urgent-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} aria-hidden="true" />
            <span>Please resolve the required fields marked below before submitting.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Basic Information */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">1. Issue Information</legend>

            {/* Title */}
            <div className="form-group">
              <label htmlFor={titleId} className="form-label">
                Issue Title <span className="form-label-required">*</span>
              </label>
              <input
                ref={titleInputRef}
                id={titleId}
                type="text"
                className={`form-input ${errors.title ? 'is-invalid' : ''}`}
                placeholder="e.g., Deep roadway crater damaging car tires"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? `${titleId}-error` : `${titleId}-hint`}
              />
              <span id={`${titleId}-hint`} className="form-helper">
                A concise summary of the specific condition.
              </span>
              {errors.title && (
                <div id={`${titleId}-error`} className="form-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor={categoryId} className="form-label">
                Category <span className="form-label-required">*</span>
              </label>
              <select
                id={categoryId}
                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-required="true"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="form-helper">
                Categorization guides appropriate public works dispatch baseline weighting.
              </span>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor={locationId} className="form-label">
                Location or Intersection <span className="form-label-required">*</span>
              </label>
              <input
                id={locationId}
                type="text"
                className={`form-input ${errors.location ? 'is-invalid' : ''}`}
                placeholder="e.g., Corner of 4th Ave & Elm St, outside Lincoln Elementary"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: null }));
                }}
                aria-required="true"
                aria-invalid={errors.location ? 'true' : 'false'}
                aria-describedby={errors.location ? `${locationId}-error` : `${locationId}-hint`}
              />
              <span id={`${locationId}-hint`} className="form-helper">
                Clear street names, cross streets, or nearby recognizable landmarks.
              </span>
              {errors.location && (
                <div id={`${locationId}-error`} className="form-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor={descriptionId} className="form-label">
                Description of the Condition <span className="form-label-required">*</span>
              </label>
              <textarea
                id={descriptionId}
                className={`form-textarea ${errors.description ? 'is-invalid' : ''}`}
                placeholder="Describe what is broken, visible hazards, dimensions, or how it affects pedestrians/drivers..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                }}
                aria-required="true"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
              />
              <span className="form-helper">
                Minimum 15 characters. Factual details help prioritize response crews.
              </span>
              {errors.description && (
                <div id={`${descriptionId}-error`} className="form-error" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>
          </fieldset>

          {/* Section 2: Explainable Scoring Factors */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">2. Priority Engine Assessment Factors</legend>
            <p className="form-helper" style={{ marginBottom: '1.25rem' }}>
              These explicit criteria deterministically calibrate triage urgency. Choose the options
              that most accurately describe the condition.
            </p>

            {/* Factor A: Safety Risk */}
            <div className="form-group">
              <span className="form-label">Safety Risk Factor (Weight: 40 pts max)</span>
              <div className="factor-choices-grid" role="radiogroup" aria-label="Safety risk options">
                {SAFETY_RISK_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`factor-choice-card ${safetyRiskId === opt.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="safetyRisk"
                      value={opt.id}
                      checked={safetyRiskId === opt.id}
                      onChange={() => setSafetyRiskId(opt.id)}
                      className="factor-radio-input"
                    />
                    <div className="factor-choice-content">
                      <div className="factor-choice-header">
                        <span className="factor-choice-title">{opt.label}</span>
                        <span className="factor-choice-points">+{opt.score} pts</span>
                      </div>
                      <p className="factor-choice-desc">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Factor B: Urgency */}
            <div className="form-group">
              <span className="form-label">Urgency & Deterioration Rate (Weight: 25 pts max)</span>
              <div className="factor-choices-grid" role="radiogroup" aria-label="Urgency options">
                {URGENCY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`factor-choice-card ${urgencyId === opt.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={opt.id}
                      checked={urgencyId === opt.id}
                      onChange={() => setUrgencyId(opt.id)}
                      className="factor-radio-input"
                    />
                    <div className="factor-choice-content">
                      <div className="factor-choice-header">
                        <span className="factor-choice-title">{opt.label}</span>
                        <span className="factor-choice-points">+{opt.score} pts</span>
                      </div>
                      <p className="factor-choice-desc">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Factor C: Community Impact & Scope */}
            <div className="form-group">
              <span className="form-label">Community Impact & Exposure (Weight: 25 pts max)</span>
              <div className="factor-choices-grid" role="radiogroup" aria-label="Community impact options">
                {COMMUNITY_IMPACT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`factor-choice-card ${communityImpactId === opt.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="communityImpact"
                      value={opt.id}
                      checked={communityImpactId === opt.id}
                      onChange={() => setCommunityImpactId(opt.id)}
                      className="factor-radio-input"
                    />
                    <div className="factor-choice-content">
                      <div className="factor-choice-header">
                        <span className="factor-choice-title">{opt.label}</span>
                        <span className="factor-choice-points">+{opt.score} pts</span>
                      </div>
                      <p className="factor-choice-desc">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Section 3: Photo Attachment */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">3. Photo Documentation (Optional)</legend>
            <div className="form-group">
              <div className="file-upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoChange}
                  className="file-input-hidden"
                  aria-label="Upload condition photo (JPEG or PNG, under 5MB)"
                />
                <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Click or drag photo here to attach
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  PNG, JPG, or WEBP up to 5MB. Stored locally in browser session.
                </div>
              </div>

              {photoPreview && (
                <div className="file-upload-preview">
                  <img src={photoPreview} alt="Attached preview" className="file-upload-thumb" />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photoName || 'Attached Photo'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 600 }}>
                      Ready for local submission
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn-secondary btn-sm"
                    aria-label="Remove attached photo"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ flexGrow: 1 }}>
              Submit Civic Report
            </button>
          </div>
        </form>
      </div>

      {/* Live Explainable Priority Engine Sidebar Preview */}
      <aside className="priority-preview-panel" aria-label="Live Priority Score Calculation Preview">
        <h3 className="preview-panel-title">Explainable Priority Engine</h3>
        <p className="preview-panel-subtitle">
          Real-time deterministic calculation based on your selected assessment parameters.
        </p>

        <div className="preview-score-display">
          <div className="preview-score-number">{livePriority.score}</div>
          <span className="preview-score-total">/ 100 max score</span>
          <div className="preview-score-bar-track">
            <div
              className="preview-score-bar-fill"
              style={{
                width: `${livePriority.score}%`,
                backgroundColor:
                  livePriority.tierKey === 'urgent'
                    ? 'var(--priority-urgent-dot)'
                    : livePriority.tierKey === 'high'
                    ? 'var(--priority-high-dot)'
                    : livePriority.tierKey === 'medium'
                    ? 'var(--priority-medium-dot)'
                    : 'var(--priority-low-dot)',
              }}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span className={`priority-pill priority-pill-${livePriority.tierKey}`}>
              <span className="priority-dot" />
              {livePriority.tierLabel}
            </span>
          </div>
        </div>

        <table className="factors-table-compact" aria-label="Scoring factor breakdown">
          <tbody>
            {livePriority.factors.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td>
                  +{f.score} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>/ {f.max}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="preview-rationale-box">
          <strong>Synthesized Rationale:</strong>
          <div style={{ marginTop: '0.25rem' }}>{livePriority.synthesizedReason}</div>
        </div>

        <p className="preview-disclaimer">
          {livePriority.disclaimer}
        </p>
      </aside>
    </div>
  );
}
