import { useState, useId, useRef } from 'react';
import {
  CATEGORIES,
  SAFETY_RISK_OPTIONS,
  URGENCY_OPTIONS,
  COMMUNITY_IMPACT_OPTIONS,
  calculatePriority,
} from '../utils/priorityEngine';
import {
  validatePhotoFile,
  processAndCompressPhoto,
} from '../utils/imageUtils';
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  Info,
} from 'lucide-react';

const LOCATION_PRESETS = [
  { label: 'Downtown / Civic Center Plaza', lat: 30.2672, lng: -97.7431 },
  { label: 'Lincoln Elementary / North Corridor', lat: 30.2747, lng: -97.7404 },
  { label: 'East Pine Transit Route #14', lat: 30.2688, lng: -97.7342 },
  { label: 'Heritage Way / Senior Center', lat: 30.2635, lng: -97.7478 },
  { label: 'Riverside Community Park & Trail', lat: 30.2541, lng: -97.7456 },
  { label: 'Elmwood Drainage Culvert', lat: 30.2812, lng: -97.7512 },
];

export default function ReportForm({ onSubmitSuccess, onNavigateToReports }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 30.2672, lng: -97.7431 });
  const [description, setDescription] = useState('');
  const [safetyRiskId, setSafetyRiskId] = useState('moderate');
  const [urgencyId, setUrgencyId] = useState('progressive');
  const [communityImpactId, setCommunityImpactId] = useState('neighborhood');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [photoSizeInfo, setPhotoSizeInfo] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // AI Issue Intelligence state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [appliedCategoryFeedback, setAppliedCategoryFeedback] = useState(false);

  // Validation & submission error state
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size and format immediately
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({
        ...prev,
        photo: validation.error,
      }));
      setPhotoPreview(null);
      setPhotoName('');
      setPhotoSizeInfo('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clear photo error and start compression
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });

    setIsProcessingPhoto(true);
    setPhotoName(file.name);

    try {
      const compressedDataUrl = await processAndCompressPhoto(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8,
      });

      setPhotoPreview(compressedDataUrl);

      const originalKb = Math.round(file.size / 1024);
      const compressedKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setPhotoSizeInfo(`${originalKb} KB → ${compressedKb} KB optimized`);
    } catch (err) {
      console.error('Error processing photo:', err);
      setErrors((prev) => ({
        ...prev,
        photo: err.message || 'Failed to process image attachment.',
      }));
      setPhotoPreview(null);
      setPhotoName('');
      setPhotoSizeInfo('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName('');
    setPhotoSizeInfo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
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
    setSubmitError(null);
    const formErrors = validate();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Focus first error field
      if (formErrors.title && titleInputRef.current) {
        titleInputRef.current.focus();
      }
      return;
    }

    if (isProcessingPhoto) {
      setSubmitError('Please wait for photo optimization to finish before submitting.');
      return;
    }

    const reportPayload = {
      title,
      category,
      location,
      coordinates,
      description,
      safetyRiskId,
      urgencyId,
      communityImpactId,
      photoUrl: photoPreview,
    };

    const result = onSubmitSuccess(reportPayload);

    if (!result || !result.success) {
      setSubmitError(
        result?.error || 'Storage error occurred. The report could not be persisted to your browser storage.'
      );
      setSubmittedReport(null);
      return;
    }

    setSubmittedReport(result.report);
    setSubmitError(null);
  };

  const handleAnalyzeWithAi = async () => {
    if (!title.trim()) {
      setAiError('Please enter an issue title before running AI Issue Intelligence.');
      return;
    }
    if (description.trim().length < 10) {
      setAiError('Please provide at least 10 characters in the description before running AI analysis.');
      return;
    }

    setIsAnalyzingAi(true);
    setAiError(null);
    setAppliedCategoryFeedback(false);

    try {
      const response = await fetch('/api/ai/interpret-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAiError(
          data?.error ||
            'AI interpretation service is unavailable. You can continue submitting your report manually.'
        );
        setAiResult(null);
        return;
      }

      setAiResult(data.interpretation);
      setAiError(null);
    } catch (err) {
      console.warn('AI service request failed:', err);
      setAiError(
        'Unable to reach the AI interpretation backend service. Ensure the local server is running.'
      );
      setAiResult(null);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleApplyAiCategory = () => {
    if (aiResult?.categorySuggestion) {
      setCategory(aiResult.categorySuggestion);
      setAppliedCategoryFeedback(true);
      setTimeout(() => setAppliedCategoryFeedback(false), 3000);
    }
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
    setPhotoSizeInfo('');
    setAiResult(null);
    setAiError(null);
    setAppliedCategoryFeedback(false);
    setErrors({});
    setSubmitError(null);
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

        {submitError && (
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
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <strong style={{ display: 'block', marginBottom: 2 }}>Storage Persistence Failed:</strong>
              <span>{submitError}</span>
            </div>
          </div>
        )}

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

              {/* Geographic Coordinates Pin Selection */}
              <div style={{ marginTop: '0.5rem', background: 'var(--sand-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--green-950)' }}>
                    📍 Map Pin Geographic Coordinates
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                    {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </span>
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ fontSize: '0.8rem' }}
                  onChange={(e) => {
                    const preset = LOCATION_PRESETS.find((p) => p.label === e.target.value);
                    if (preset) {
                      setCoordinates({ lat: preset.lat, lng: preset.lng });
                      if (!location.trim()) {
                        setLocation(preset.label);
                      }
                    }
                  }}
                  aria-label="Select municipal coordinate corridor"
                >
                  <option value="">Align with Municipal Corridor Preset...</option>
                  {LOCATION_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label} ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Ensures this incident plots accurately on the Administrator Operations Map.
                </div>
              </div>
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

            {/* AI Issue Intelligence Action & Advisory Card */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--green-700)' }} aria-hidden="true" />
                    AI Issue Intelligence (Advisory Assistant)
                  </span>
                  <span className="form-helper">
                    Optional Gemini analysis to suggest categories, extract hazard indicators, and flag missing details.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleAnalyzeWithAi}
                  disabled={isAnalyzingAi || !title.trim() || description.trim().length < 10}
                  aria-label="Analyze report with AI Issue Intelligence"
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 size={14} className="spin" aria-hidden="true" />
                      <span>Analyzing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} aria-hidden="true" />
                      <span>Analyze with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Informative Error or Unconfigured Callout */}
              {aiError && (
                <div
                  role="status"
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} aria-hidden="true" />
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>AI Advisory Service Notice:</strong>
                    <span>{aiError}</span>
                  </div>
                </div>
              )}

              {/* Structured AI Advisory Card */}
              {aiResult && (
                <div className="ai-advisory-card" role="region" aria-label="AI Issue Intelligence Advisory">
                  <div className="ai-card-header">
                    <div className="ai-card-title-group">
                      <Sparkles size={18} style={{ color: 'var(--green-700)' }} aria-hidden="true" />
                      <span>AI Issue Intelligence Advisory</span>
                    </div>
                    <span className="ai-advisory-badge">
                      Advisory Only — Human Review Required
                    </span>
                  </div>

                  {/* Category Suggestion with Apply Action */}
                  <div className="ai-field-block">
                    <span className="ai-field-label">Suggested Infrastructure Category:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="category-tag" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                        {aiResult.categorySuggestion}
                      </span>
                      {category !== aiResult.categorySuggestion ? (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={handleApplyAiCategory}
                        >
                          {appliedCategoryFeedback ? (
                            <>
                              <Check size={12} aria-hidden="true" />
                              <span>Applied!</span>
                            </>
                          ) : (
                            <span>Apply to Category</span>
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--green-700)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Check size={12} aria-hidden="true" /> Currently Selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hazard Indicators */}
                  {aiResult.hazardIndicators && aiResult.hazardIndicators.length > 0 && (
                    <div className="ai-field-block">
                      <span className="ai-field-label">Identified Physical Hazard Indicators:</span>
                      <div className="ai-indicators-list">
                        {aiResult.hazardIndicators.map((hazard, idx) => (
                          <span key={idx} className="ai-hazard-chip">
                            {hazard}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgency Assessment */}
                  <div className="ai-field-block">
                    <span className="ai-field-label">Suggested Deterioration Urgency:</span>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {aiResult.urgencySuggestion}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      (Verify against field criteria in Section 2)
                    </span>
                  </div>

                  {/* Missing Information */}
                  {aiResult.missingInformation && aiResult.missingInformation.length > 0 && (
                    <div className="ai-field-block">
                      <span className="ai-field-label">Missing Information for Field Dispatch:</span>
                      <ul className="ai-missing-list">
                        {aiResult.missingInformation.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Next Step */}
                  {aiResult.recommendedNextStep && (
                    <div className="ai-field-block">
                      <span className="ai-field-label">Recommended Municipal Action:</span>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {aiResult.recommendedNextStep}
                      </p>
                    </div>
                  )}

                  <div className="ai-disclaimer-note">
                    <strong>Algorithmic Notice:</strong> This interpretation was generated by Google Gemini as a decision-support advisory. It does not alter your selected risk factors or replace the authoritative deterministic Priority Engine below.
                  </div>
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
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={isProcessingPhoto}
                  className="file-input-hidden"
                  aria-label="Upload condition photo (JPEG, PNG, or WebP under 1 MB)"
                />
                {isProcessingPhoto ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                    <Loader2 size={24} className="spin" style={{ color: 'var(--green-700)' }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Optimizing photo for storage...
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Click or drag photo here to attach
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      PNG, JPG, or WEBP up to 1 MB. Automatically compressed to preserve storage quota.
                    </div>
                  </>
                )}
              </div>

              {errors.photo && (
                <div className="form-error" role="alert" style={{ marginTop: '0.5rem' }}>
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errors.photo}</span>
                </div>
              )}

              {photoPreview && (
                <div className="file-upload-preview">
                  <img src={photoPreview} alt="Attached preview" className="file-upload-thumb" />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photoName || 'Attached Photo'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 600 }}>
                      {photoSizeInfo ? `${photoSizeInfo} • Ready for local submission` : 'Ready for local submission'}
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
            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessingPhoto}
              style={{ flexGrow: 1, opacity: isProcessingPhoto ? 0.7 : 1 }}
            >
              {isProcessingPhoto ? 'Optimizing photo...' : 'Submit Civic Report'}
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
