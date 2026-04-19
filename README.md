# Out & About

A social dare game for up to 20 players. Create a room, swipe through dares, complete them with photo/video proof, and compete on a live leaderboard. Get personal and group reels at the end.

## Stack

| Layer | Tech |
|---|---|
| iOS App | Swift 5.10, SwiftUI, AVKit, PhotosUI |
| Auth | Firebase Anonymous Auth |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| Backend Logic | Firebase Cloud Functions (TypeScript) |
| Video Rendering | Cloud Run + ffmpeg |
| CI/CD | GitHub Actions |

---

## Prerequisites

- Xcode 15.4+
- Node 20+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- XcodeGen: `brew install xcodegen`
- Docker (for render worker)
- A Firebase project with Firestore, Storage, Auth (anonymous), and Functions enabled

---

## First-Time Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/fortheplot.git
cd fortheplot
```

### 2. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `out-and-about-prod`)
3. Enable **Firestore** (Native mode), **Storage**, **Authentication** (Anonymous), **Functions**
4. Register an iOS app with bundle ID `com.yourcompany.outandabout`
5. Download `GoogleService-Info.plist` — **do not commit this file**

### 3. Configure iOS app

```bash
# Copy the placeholder and replace with your real config
cp ios-app/OutAndAbout/Resources/GoogleService-Info.placeholder.plist \
   ios-app/OutAndAbout/Resources/GoogleService-Info.plist
# Replace the placeholder values with your real Firebase config
```

### 4. Generate Xcode project

```bash
cd ios-app
xcodegen generate
open OutAndAbout.xcodeproj
```

### 5. Install Functions dependencies

```bash
cd functions
npm install
```

### 6. Install render worker dependencies

```bash
cd render-worker
npm install
```

---

## Local Development (Firebase Emulator Suite)

```bash
# Start all emulators
firebase emulators:start

# In another terminal, seed dares
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/validateAndSeedDares \
  -H "X-Admin-Secret: local-dev-secret"
```

Emulator UI is available at http://localhost:4000

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for full step-by-step instructions.

### Quick deploy

```bash
# Deploy Firestore rules + indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Deploy Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Cloud Run render worker

```bash
cd render-worker

# Build image
docker build -t gcr.io/YOUR_PROJECT_ID/render-worker:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/render-worker:latest

# Deploy to Cloud Run
gcloud run deploy render-worker \
  --image gcr.io/YOUR_PROJECT_ID/render-worker:latest \
  --region us-central1 \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 1800 \
  --no-allow-unauthenticated
```

After deploying Cloud Run, set the URL in Functions config:

```bash
firebase functions:config:set render.worker_url="https://render-worker-XXXXX-uc.a.run.app"
firebase functions:config:set render.admin_secret="your-admin-secret-here"
```

### Seed dares (production)

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/validateAndSeedDares \
  -H "X-Admin-Secret: your-admin-secret-here"
```

---

## GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | Your GCP / Firebase project ID |
| `FIREBASE_TOKEN` | Firebase CI token (`firebase login:ci`) |
| `GCP_SA_KEY` | Base64-encoded GCP service account JSON |
| `RENDER_ADMIN_SECRET` | Secret for seeding dares endpoint |

---

## Repo Structure

```
fortheplot/
├── ios-app/           Swift/SwiftUI iPhone app
├── functions/         Firebase Cloud Functions (TypeScript)
├── render-worker/     Cloud Run video render worker (Node + ffmpeg)
├── docs/              Architecture and deployment docs
├── Seed/              Dare seed data
├── .github/workflows/ CI/CD pipelines
├── firestore.rules    Firestore security rules
├── storage.rules      Storage security rules
├── firestore.indexes.json
└── firebase.json
```

---

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)

---

## License

MIT
