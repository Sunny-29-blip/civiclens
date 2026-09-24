# 🔍 CivicLens — AI Civic Infrastructure & Governance Intelligence Platform

> **Google Code for Communities / Google Cloud AI Hackathon**  
> An end-to-end civic complaint routing, multilingual multi-category AI analysis, canonical jurisdiction verification, and tiered executive hotspot governance platform for India, powered by **Google Cloud Gemini (`gemini-2.5-flash`)** and **Google Cloud Firestore**.

---

## 🌟 Key Highlights & Capabilities

1. **100vh Full Landing Hero**: Initial viewport displays an executive hero experience with headline *"Your problems, finally in focus."*, capability trust strip, SVG Spectacles visual, and smooth scrolling to the reporting studio below the fold.
2. **Multilingual Voice & Text Input**: Accepts complaints in English, Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, or Hinglish via Web Speech API or textarea dictation.
3. **Two-Stage Multi-Label Classification**:
   - **Stage 1 (Gemini AI)**: Multilingual understanding and structured schema extraction using Google Gemini.
   - **Stage 2 (Deterministic Evidence Scanner)**: Conservative physical keyword validation ensuring compound issues (e.g. potholes + 2-hour traffic jams -> `roads` + `traffic`) are fully captured.
4. **Canonical Jurisdiction Normalization**:
   - Strictly enforces Indian State, District, and Locality mapping (e.g. `Hyderabad, Telangana` is validated as `Telangana` and NEVER converted to `Uttar Pradesh`).
   - Prioritizes authoritative citizen hints and explicit text tokens over LLM guesses.
5. **Explainable 0–100 Governance Priority Index**:
   - Transparent, integer-clamped priority score (e.g. `82 / 100`) based on urgency, safety risks, compound failures, and persistence.
   - Generates deterministic, human-readable rationale explanations for government officials.
6. **Citizen Category Verification & Editing**:
   - Displays detected issues as interactive chips with hover-revealed `×` on desktop and touch controls on mobile.
   - Provides a `+ Add category` picker for citizen-controlled additions before final persistence.
7. **4-Tier Government Governance Portal**:
   - National, State, District, and Local official accounts with server-side jurisdiction scope enforcement.
   - 5 Key KPIs: **Total Complaints**, **High Priority (≥75)**, **Open Issues**, **Resolved Issues**, and **Average Priority (0–100)**.
   - Hotspot clustering and Recharts visualizations with multi-category array aggregations.
8. **Single Unified Firebase Architecture**:
   - Client Web SDK (`firebase.js`) + Backend Admin SDK (`firestore_service.py`).
   - Centralized collection constants (`complaints`, `users`, `officials`, `analytics`).
   - Zero-config local JSON database fallback for instant offline testing.

---

## 🏗️ Architecture & Data Flow

```
[Citizen Input] -> [Web Speech / Text] 
  -> [POST /requests/analyze] 
  -> [Google Gemini AI + Deterministic Evidence Scanner] 
  -> [Canonical Location Normalizer] 
  -> [0-100 Priority Engine]
  -> [Citizen Category Review (+ Add / Hover Remove)] 
  -> [POST /requests/submit]
  -> [Google Cloud Firestore] 
  -> [Public Feed + 4-Tier Officials Hotspots Dashboard]
```

---

## 🗂️ Category Taxonomies

| Area Type | Allowed Taxonomy Categories |
| :--- | :--- |
| **Urban** | `roads`, `electricity`, `water_shortage`, `pollution`, `traffic`, `infra_quality`, `road_expansion` |
| **Rural** | `roads`, `electricity`, `irrigation_water`, `healthcare_access`, `network_coverage` |

---

## 🏛️ 4-Tier Government Accounts (Demo Credentials)

| Tier | Official ID | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **National** | `admin` | `civic2026` | Full All-India visibility, State-by-State Priority Index |
| **State (UP)** | `state_up` | `jal2026` | Uttar Pradesh only, District-by-District Breakdown |
| **State (Delhi)** | `delhi_pwd` | `pwd2026` | Delhi NCT only, Urban PWD Infrastructure |
| **District (Varanasi)**| `dm_varanasi`| `varanasi2026` | Varanasi District only, Locality & Sector Analytics |
| **District (Bengaluru)**| `bbmp_bangalore`| `bbmp2026`| Bengaluru Urban only, Traffic & Road Hotspots |
| **Local (Rampur)** | `local_rampur` | `local2026` | Rampur Village only, Direct Status Resolution Workflow |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Google Gemini API Key
- (Optional) Firebase Service Account JSON

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env
# Edit .env with your GEMINI_API_KEY if available

# Start backend server (Port 8000)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Running Automated Tests
```bash
cd backend
python3 -m pytest tests/ -v
# 39 passing tests covering all 12 regression scenarios
```

---

## 🔒 Security & Best Practices

- **Never Commit Secrets**: `.env` and service account files are strictly excluded via `.gitignore` and `.dockerignore`.
- **Backend-Only Gemini Integration**: Gemini API keys and Admin SDK private keys are never sent to the browser.
- **Server-Side Scope Enforcement**: Officer permissions and jurisdiction boundaries are cryptographically enforced on the server.
