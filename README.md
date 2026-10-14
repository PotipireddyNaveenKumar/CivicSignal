# CivicSignal — Transparent Community Issue Prioritization & Operations Platform

> **"Turn community problems into transparent, prioritized, actionable reports."**

CivicSignal is an AI-assisted civic triage and municipal operations platform designed to connect residents who encounter everyday infrastructure hazards with municipal dispatchers and authorized field response crews.

---

## 🏛️ Core Capabilities

### 1. Transparent Deterministic Priority Engine
- **Sole Mathematical Authority**: Priority scores (0–100) and tiers (**Urgent / Critical**, **High**, **Medium**, **Low**) are calculated through an explicit, mathematically inspectable algorithm.
- **Safety Supremacy**: Physical safety risk (up to 40 pts) and urgency/degradation (up to 25 pts) dominate triage. Popularity can never outrank a life-threatening hazard.
- **Explainable Synthesized Rationale**: Plain-English justification of why an issue is scored and prioritized, visible to all stakeholders.

### 2. Bounded Community Support & Dynamic Prioritization
- **"I have this problem too"**: Community members can confirm identical issues with a single click.
- **Duplicate Prevention**: Unique local citizen endorsement tracking prevents repeated voting spam.
- **Bounded Impact Contribution**: Endorsements contribute to community-impact scope (0 supporters = 0 pts; 1–2 = 5 pts; 3–5 = 10 pts; 6–10 = 15 pts; 11–20 = 20 pts; 21+ = 25 pts), capped at 25 points maximum so crowd volume remains bounded.
- **Audit Trail**: Every endorsement logs an audit event in the triage timeline.

### 3. Interactive Municipal Operations Map
- **Leaflet & OpenStreetMap**: Integrated interactive map visualizing geocoded community incidents.
- **Priority-Colored Markers**:
  - 🔴 **Urgent / Critical** (Score 80–100)
  - 🟠 **High Priority** (Score 60–79)
  - 🟡 **Medium Priority** (Score 35–59)
  - 🟢 **Low Priority** (Score <35)
  - ⚪ **Resolved**
- **Incident Inspector**: Selecting any map marker displays real-time triage scoring, citizen confirmations, reported address, and assigned operational units.
- **Graceful Unmapped Handling**: Identifies reports pending precise coordinates in a dedicated review drawer without crashing.

### 4. Gemini AI Issue Intelligence (Advisory Assistant)
- **Official Google Gen AI SDK (`@google/genai` v2.29.1)**: Calls verified Gemini models (`gemini-3-flash-preview` with automatic fallback to `gemini-3.8-flash`).
- **Structured JSON Schema**: Returns category recommendations, physical hazard indicators, deterioration urgency, missing municipal details, and next steps for field dispatch.
- **Strict Advisory Boundary**: AI analysis is clearly labeled `ADVISORY ONLY — HUMAN REVIEW REQUIRED`. AI does not set numerical priority scores or override citizen selections.
- **Graceful Fallback**: If unconfigured or offline, manual report creation and deterministic scoring continue seamlessly.

### 5. Role-Aware Operations & Lifecycle Workflow
Simulates the complete municipal response lifecycle across three perspectives:
1. **👤 Community Member (Citizen)**: File reports, pick municipal coordinates, upload/compress photos, track status, and endorse existing issues.
2. **🏛️ Municipal Administrator**: Overview metrics, interactive operations map, review queue, assign authorized departments/resolvers, and set dispatch notes.
3. **🔧 Authorized Field Resolver**: Review assigned work orders, acknowledge/commence work (`In Progress`), and complete tasks with resolution notes (`Resolved`).

**Lifecycle Progression**:
```
Submitted (Open) ──► Under Review ──► Assigned ──► In Progress ──► Resolved
```

### 6. Photo Validation & Client-Side Canvas Compression
- 1 MB file upload ceiling with strict MIME-type validation.
- Client-side Canvas downscaling (max 1200px, 0.75 WebP/JPEG quality) preventing browser `localStorage` quota exhaustion.

---

## 🛠️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, Lucide React icons, Leaflet.
- **Styling**: Vanilla CSS design system (warm off-white surfaces, forest-green accents, accessible contrast).
- **Backend**: Lightweight Node.js Express service (`server/index.js`) with 50 KB payload limits.
- **AI SDK**: `@google/genai` (v2.29.1) utilizing structured output schemas.
- **Persistence**: Browser `localStorage` with quota detection and automatic backward-compatible schema backfilling.

---

## 🔒 Security & Credential Isolation

- `GEMINI_API_KEY` is loaded **exclusively** in the server environment (`server/index.js`).
- The browser client interacts solely via relative endpoint `/api/ai/interpret-issue`.
- No API keys are embedded in frontend bundles, build artifacts, or Git history.
- `.gitignore` explicitly prevents `.env` and `.env.*` from being committed. `.env.example` provides sanitized placeholder configuration only.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
# Clone repository
git clone https://github.com/PotipireddyNaveenKumar/CivicSignal.git
cd CivicSignal

# Install dependencies
npm install
```

### Environment Configuration (Optional for AI Intelligence)
```bash
# Copy placeholder environment
cp .env.example .env

# Edit .env and supply your Gemini API key:
# GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is supplied, CivicSignal runs normally; AI analysis will display an unconfigured advisory notice while manual submission, maps, and scoring remain fully functional).*

### Running Locally
```bash
# Run backend server (port 3001) and Vite dev server (port 5173) concurrently:
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

Run the automated verification test suite:
```bash
npm test
```
**Test Coverage**:
- Bounded community support contribution (0 to 25 pts cap).
- Safety hazard supremacy over crowd popularity.
- Category baseline weighting integrity.
- Deterministic score and tier recalculation.

Run linting and production build verification:
```bash
npm run lint
npm run build
```

---

## ⚠️ Prototype Realities & Known Limitations

1. **Role Simulation**: The active session role switcher simulates authorization in the user interface. Production deployment requires server-verified JWT/OAuth session tokens.
2. **Local Storage Persistence**: Data is persisted in the local browser's `localStorage`. Multi-device cross-synchronization requires a hosted relational or document database.
3. **Simulated Demonstration Records**: Default sample records are explicitly labeled as demonstration data and do not represent actual emergency dispatch calls or government citations.
4. **Advisory AI**: Gemini issue interpretation is strictly an advisory aid for human municipal staff; it cannot alter deterministic triage scores or verify real-world physical hazards without human inspection.
