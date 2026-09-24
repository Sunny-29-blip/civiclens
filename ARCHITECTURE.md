# CivicLens — End-to-End System Architecture & Data Flow

This document details the complete end-to-end architectural flow of **CivicLens** from citizen grievance ingestion to Google Cloud Gemini classification, Firestore persistence, multi-category analytics aggregation, and tiered government executive dashboards.

---

## 1. High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CITIZEN CLIENT (Frontend)                                       │
│   • 100vh Full Hero Landing Page                                                                       │
│   • Multilingual Voice Dictation (Web Speech API)                                                      │
│   • 5-Step Gemini AI Pipeline Feedback                                                                 │
│   • Interactive Category Chip Management (Hover `×` Removal + `+ Add category` Selector)              │
│   • Explainable 0–100 Governance Priority Index Display                                                │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │ HTTPS POST /requests/analyze or /requests/submit
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BACKEND INGESTION & AI PIPELINE                                     │
│                                                                                                        │
│   [ STAGE 1: Google Gemini AI Semantic Extraction ]                                                    │
│   • Model: gemini-2.5-flash via Google GenAI SDK with Pydantic Structured Schema                       │
│   • Multilingual normalization (Hindi, Telugu, Tamil, Hinglish -> English Summary)                   │
│   • Initial category detection & area classification (Urban vs Rural)                                  │
│                                                                                                        │
│   [ STAGE 2: Deterministic Evidence Scanner & Category Merging ]                                       │
│   • Word-boundary regex keyword verification against original grievance text                           │
│   • Merges verified missing issues (e.g. Gemini returns ["traffic"] + text has "potholes" -> ["roads"])│
│   • Strict taxonomy enforcement (Urban vs Rural) capped at max 3 categories                            │
│                                                                                                        │
│   [ STAGE 3: Canonical Jurisdiction Normalizer ]                                                       │
│   • Evaluates citizen State Hint, District Hint, and explicit text tokens                              │
│   • Canonical dictionary mapping (e.g. "Hyderabad, Telangana" -> Telangana, NEVER Uttar Pradesh)      │
│   • Eliminates hallucinated state/district mappings                                                    │
│                                                                                                        │
│   [ STAGE 4: Explainable 0–100 Priority Engine ]                                                       │
│   • Deterministic calculation: Base Urgency + Safety Hazard + Multi-Issue + Persistence + Supports     │
│   • Normalizes to 0 <= score <= 100 integer with human-readable rationale explanation string           │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD PERSISTENCE & STORAGE (Firestore)                                   │
│   • Single Unified Project (`jansetu-d2106`)                                                           │
│   • Centralized collection constants (`complaints`, `users`, `officials`, `analytics`)                 │
│   • Multi-category arrays stored as `categories: ["roads", "traffic"]`                                 │
│   • Atomic support incrementing via Firestore Increment                                                │
│   • Seamless local JSON persistence fallback for offline / test environments                           │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 4-TIER GOVERNANCE & ANALYTICS ENGINE                                   │
│   • Server-Side Scope Enforcement:                                                                     │
│       - National Tier: Full India visibility                                                           │
│       - State Tier: Scoped strictly to officer's state (e.g. Uttar Pradesh)                            │
│       - District Tier: Scoped to officer's district (e.g. Varanasi, Bengaluru Urban)                   │
│       - Local Tier: Scoped to Gram Panchayat / Ward (e.g. Rampur)                                      │
│   • Multi-Category Hotspot Aggregation: Explodes category arrays so compound issues count everywhere   │
│   • 5 Core Governance KPIs: Total Complaints, High Priority, Open Issues, Resolved, Average Priority   │
│   • Recharts Interactive Visualizations (Priority distribution, multi-category shares, locality maps)  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Data Journey: Step-by-Step

### Step 1: Citizen Ingestion & Multilingual Input
1. The citizen visits CivicLens and sees the complete **100vh Landing Hero**.
2. Scrolling down smoothly opens the **Grievance Reporting Studio**.
3. The citizen writes or dictates their grievance in English or any Indian language (Hindi, Telugu, Tamil, Kannada, Marathi, Bengali).
   - *Example Text*: `"Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers."`
4. The citizen selects optional State/District hints (e.g. `Karnataka`, `Bengaluru Urban`).

### Step 2: Gemini Analysis Request (`POST /requests/analyze`)
The client sends the payload to the backend:
```json
{
  "text": "Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers.",
  "state": "Karnataka",
  "district": "Bengaluru Urban",
  "locality": "Silk Board",
  "manual_categories": []
}
```

### Step 3: Two-Stage AI Classification & Canonical Jurisdiction
1. **Gemini Semantic Extraction**: Calls `gemini-2.5-flash` with structured Pydantic schema, generating initial multi-label categories, area type, English summary, and urgency.
2. **Deterministic Evidence Scanner**: Scans the original complaint text for physical infrastructure evidence using word-boundary matching.
3. **Location Normalization**: `normalize_location()` verifies city names, pinpoints `Silk Board` in `Bengaluru Urban, Karnataka`, and enforces canonical state mapping without hallucinations.
4. **0–100 Priority Engine**: `calculate_priority_score()` computes:
   - Base High Urgency: `+45`
   - Safety Hazard (accidents, two-wheelers): `+25`
   - Multi-Issue Complexity (dual co-occurring failures): `+10`
   - Recurring Daily Disruption (2-hour daily jams): `+10`
   - **Total Priority Score: `90 / 100`**
   - **Rationale**: `"Priority: 90/100 · High urgency + immediate safety/health hazard + dual co-occurring issues + recurring daily disruption."`

### Step 4: Citizen Verification & Category Management
1. The frontend displays the analyzed card with interactive category chips:
   - `[ Roads AI × ]` `[ Traffic AI × ]`
2. The citizen can click **`+ Add category`** to add any missed category (e.g. `[ Pollution Citizen × ]`).
3. The citizen can hover over any chip to reveal the `×` button and remove an irrelevant tag.

### Step 5: Final Submission to Firestore (`POST /requests/submit`)
The final confirmed categories are stored in Firestore:
```json
{
  "id": "c-9a8b7c6d",
  "raw_text": "Outer Ring Road near Silk Board Junction has massive crater potholes...",
  "area_type": "urban",
  "categories": ["roads", "traffic"],
  "ai_categories": ["roads", "traffic"],
  "manual_categories": [],
  "state": "Karnataka",
  "district": "Bengaluru Urban",
  "locality": "Silk Board",
  "urgency": "high",
  "priority_score": 90,
  "priority_reason": "Priority: 90/100 · High urgency + immediate safety/health hazard + dual co-occurring issues + recurring daily disruption.",
  "summary": "Severe crater potholes near Silk Board junction causing 2-hour daily traffic jams and safety risks for two-wheelers.",
  "original_language": "English",
  "status": "pending",
  "support_count": 1,
  "high_priority": true,
  "timestamp": 1726671234.56,
  "classified_by": "gemini"
}
```

### Step 6: Hotspot Matrix & Government Dashboard
1. The complaint immediately appears in the **Public Feed** for citizen upvoting.
2. In the **Government Officials Portal**, the grievance is automatically routed based on jurisdiction:
   - Local BBMP ward engineer sees the Silk Board report.
   - District Magistrate (Bengaluru Urban) observes the district priority index.
   - National IAS Officers monitor aggregate state-by-state infrastructure metrics.
3. Multi-category analytics increment both `Roads` (+1) and `Traffic` (+1) statistics simultaneously.
