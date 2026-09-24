# CivicLens — Firebase & Cloud Firestore Architecture Setup Guide

This document provides complete instructions for configuring Google Firebase, Firebase Authentication, Cloud Firestore, and Firebase Admin SDK for the **CivicLens** digital public infrastructure platform.

---

## 1. Firebase Architectural Overview

CivicLens uses a **single unified Firebase project** across the entire stack:
- **Frontend (Web Client)**: Uses Firebase Web SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`) with safe, public client configuration keys (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.).
- **Backend (API Service)**: Uses Google Cloud Firestore / Firebase Admin SDK with server-side authentication (Service Account credentials via `FIREBASE_CREDENTIALS_PATH` or `GOOGLE_APPLICATION_CREDENTIALS`), providing cryptographic verification of tokens and strict server-side scoping.
- **Offline / Local Dev Mode**: When Firebase credentials are not provided, CivicLens automatically activates its **Zero-Config Local JSON Fallback Store** with atomic updates and bcrypt password hashing, ensuring the app works out-of-the-box for testing and hackathon judging.

```
┌─────────────────────────────────────────────────────────────┐
│                    CivicLens Client (Vite)                  │
│       Firebase Web SDK: Auth UI & Realtime Queries          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS API / Bearer Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Service                   │
│   • Token Verification • Gemini AI • 0-100 Priority Engine  │
│   • Canonical Location Normalizer • Tier Scoping            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Firebase Admin SDK
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Cloud Firestore                      │
│     complaints | users | officials | analytics              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Concepts & Terminology

| Concept | Purpose | Security Classification |
| :--- | :--- | :--- |
| **Firebase Project ID** | Unique identifier for your GCP/Firebase project (e.g. `jansetu-d2106` or `civiclens-prod`) | Public / Config |
| **Firebase App ID** | Web application identifier created inside Firebase Console | Public / Config |
| **Firebase Web API Key** | Client API key used by Firebase Web SDK to identify traffic | Public (Restricted to domain in Google Cloud Console) |
| **Auth Domain** | Domain for OAuth redirects (e.g. `your-project.firebaseapp.com`) | Public |
| **Service Account JSON** | Private RSA key used by the Backend Admin SDK to read/write Firestore with administrative privileges | **CRITICAL SECRET — NEVER COMMIT, NEVER EXPOSE TO FRONTEND** |
| **Firebase Auth UID** | Permanent cryptographic identifier for authenticated citizens | Internal ID |
| **ID Token (JWT)** | Short-lived cryptographically signed token sent in `Authorization: Bearer <token>` | Private to session |

---

## 3. Step-by-Step Firebase Console Setup

### Step 1: Create Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g. `civiclens-india`).
3. (Optional) Enable Google Analytics and click **Create Project**.

### Step 2: Register Web Application
1. In Project Overview, click the **Web icon (`</>`)** to add a web app.
2. App nickname: `CivicLens Web`.
3. Check "Also set up Firebase Hosting" if desired.
4. Copy the `firebaseConfig` properties:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Enable Firebase Authentication
1. Go to **Build > Authentication** > Click **Get Started**.
2. In the **Sign-in method** tab:
   - **Phone**: Enable Phone authentication (or use the built-in CivicLens SMS simulation with demo OTP `123456`).
   - **Google**: Enable Google sign-in provider if desired.
   - **Email/Password**: Enable for citizen/official credentials.

### Step 4: Create Cloud Firestore Database
1. Go to **Build > Firestore Database** > Click **Create database**.
2. Select **Production mode** (or apply rules from `firestore.rules`).
3. Choose a Firestore location near your primary region (e.g. `asia-south1` for Mumbai / India).
4. Click **Enable**.

### Step 5: Generate Backend Service Account Credentials
1. Click the **Gear icon (Project Settings)** > **Service accounts** tab.
2. Select **Python** as the runtime.
3. Click **Generate new private key** > **Generate key**.
4. Save the downloaded JSON file locally to `backend/credentials/firebase-service-account.json`.
5. Ensure this path is in `.gitignore` so it is **NEVER** committed to version control.

---

## 4. Firestore Security Rules (`firestore.rules`)

Deploy the following production rules via Firebase CLI (`firebase deploy --only firestore:rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Centralized Collection Paths
    match /complaints/{complaintId} {
      // Any public user can read public complaints feed
      allow read: if true;
      
      // Citizens can create complaints with validated fields
      allow create: if request.resource.data.categories is list
                    && request.resource.data.urgency in ['low', 'medium', 'high']
                    && request.resource.data.priority_score >= 0
                    && request.resource.data.priority_score <= 100;
      
      // Only authenticated users can increment support count
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['support_count', 'high_priority'])
                    || request.auth.token.role in ['admin', 'state_official', 'district_official', 'local_official'];
      
      // Deletions restricted to administrators
      allow delete: if request.auth.token.role == 'admin';
    }

    match /officials/{officialId} {
      allow read: if request.auth != null;
      allow write: if false; // Governed by server-side Admin SDK only
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Environment Configuration

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=civiclens-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jansetu-d2106
VITE_FIREBASE_STORAGE_BUCKET=civiclens-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Backend (`backend/.env`)
```bash
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=jansetu-d2106
FIREBASE_CREDENTIALS_PATH=credentials/firebase-service-account.json
DEMO_OTP=123456
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

---

## 6. Verifying Connectivity & Diagnostics

Check backend and cloud services status using the health diagnostic endpoint:

```bash
curl http://localhost:8000/api/health
```

**Example Healthy Response:**
```json
{
  "status": "healthy",
  "service": "civiclens-backend",
  "storage": "firestore",
  "storage_details": {
    "storage": "firestore",
    "project_id": "jansetu-d2106",
    "reason": "Connected to Google Cloud Firestore (Project: jansetu-d2106)"
  },
  "gemini": {
    "configured": true,
    "reachable": true,
    "model": "gemini-2.5-flash",
    "message": "Gemini API (gemini-2.5-flash) is active and verified."
  }
}
```

---

## 7. Credential Rotation & Security Incident Response

If a service account key or API key is ever accidentally shared or exposed:
1. Go to **Google Cloud Console > IAM & Admin > Service Accounts**.
2. Locate the service account > Click **Keys** tab.
3. Click the **Trash icon** next to the compromised key to immediately revoke it.
4. Click **Add Key > Create new key (JSON)** to issue a replacement.
5. Update your local environment variables and redeploy the backend service.
