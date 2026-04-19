# Out & About — Deployment Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Xcode | 15.4+ | Mac App Store |
| XcodeGen | Latest | `brew install xcodegen` |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| Docker | Latest | [docker.com](https://docker.com) |
| Google Cloud SDK | Latest | [cloud.google.com/sdk](https://cloud.google.com/sdk) |

---

## 1. Firebase Project Setup

### 1.1 Create Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name it (e.g. `out-and-about-prod`)
3. Enable Google Analytics (optional)

### 1.2 Enable services

In the Firebase console:

- **Firestore**: Build → Firestore Database → Create database → Start in **Native mode** → Choose region
- **Storage**: Build → Storage → Get started → Choose same region
- **Authentication**: Build → Authentication → Get started → Sign-in method → **Anonymous** → Enable
- **Functions**: Build → Functions → Get started (requires Blaze plan)

### 1.3 iOS App Registration

1. Project Settings → Add app → iOS
2. Bundle ID: `com.outandabout.app`
3. Download `GoogleService-Info.plist`
4. Copy to `ios-app/OutAndAbout/Resources/GoogleService-Info.plist` (gitignored)

---

## 2. Local Development Setup

### 2.1 Clone and install

```bash
git clone https://github.com/YOUR_ORG/fortheplot.git
cd fortheplot
```

### 2.2 Functions setup

```bash
cd functions
npm install
cd ..
```

### 2.3 Render worker setup

```bash
cd render-worker
npm install
cd ..
```

### 2.4 Firebase login

```bash
firebase login
firebase use --add   # select your project
```

### 2.5 Set Functions config (for local emulation)

```bash
firebase functions:config:set \
  render.worker_url="http://localhost:8080" \
  render.admin_secret="local-dev-secret"
```

### 2.6 Start emulators

```bash
firebase emulators:start
```

Emulator UI: http://localhost:4000

### 2.7 Seed dares (emulator)

```bash
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/validateAndSeedDares \
  -H "X-Admin-Secret: local-dev-secret"
```

---

## 3. iOS App Setup

### 3.1 Generate Xcode project

```bash
cd ios-app
xcodegen generate
open OutAndAbout.xcodeproj
```

### 3.2 Add GoogleService-Info.plist

Add the downloaded `GoogleService-Info.plist` to `OutAndAbout/Resources/` in Xcode. Make sure **Target Membership** is checked for OutAndAbout.

### 3.3 Build and run

Select **iPhone 15** simulator → ⌘+R

---

## 4. Production Deployment

### 4.1 Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

### 4.2 Deploy Storage rules

```bash
firebase deploy --only storage
```

### 4.3 Deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 4.4 Seed dares (production)

```bash
# First set your admin secret
firebase functions:config:set render.admin_secret="YOUR_STRONG_SECRET"
firebase deploy --only functions

# Then seed
curl -X POST https://REGION-PROJECT_ID.cloudfunctions.net/validateAndSeedDares \
  -H "X-Admin-Secret: YOUR_STRONG_SECRET"
```

---

## 5. Cloud Run Render Worker Deployment

### 5.1 Enable required APIs

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### 5.2 Build and push Docker image

```bash
cd render-worker

# Build image
docker build -t gcr.io/YOUR_PROJECT_ID/render-worker:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/render-worker:latest
```

### 5.3 Deploy to Cloud Run

```bash
gcloud run deploy render-worker \
  --image gcr.io/YOUR_PROJECT_ID/render-worker:latest \
  --region us-central1 \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 1800 \
  --concurrency 1 \
  --no-allow-unauthenticated \
  --project YOUR_PROJECT_ID
```

### 5.4 Get the service URL

```bash
gcloud run services describe render-worker \
  --region us-central1 \
  --format 'value(status.url)'
```

### 5.5 Configure Functions to use worker URL

```bash
firebase functions:config:set \
  render.worker_url="https://render-worker-XXXXX-uc.a.run.app"
firebase deploy --only functions
```

### 5.6 Grant Cloud Functions permission to invoke Cloud Run

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant invoker role to the Cloud Functions service account
gcloud run services add-iam-policy-binding render-worker \
  --region us-central1 \
  --member "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role "roles/run.invoker"
```

---

## 6. GitHub Actions Setup

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Where to get it |
|---|---|
| `GCP_PROJECT_ID` | Firebase console → Project settings → Project ID |
| `FIREBASE_TOKEN` | Run `firebase login:ci` |
| `GCP_SA_KEY` | GCP Console → IAM → Service Accounts → Create key (JSON) → base64 encode |
| `RENDER_ADMIN_SECRET` | The secret you set in Functions config |

---

## 7. iOS Distribution (TestFlight / App Store)

### 7.1 Code signing

1. Create an App ID in Apple Developer portal: `com.outandabout.app`
2. Create a Distribution certificate
3. Create a Provisioning Profile (App Store)
4. Set up Fastlane (recommended) or Xcode Automatic Signing

### 7.2 Bundle identifier

Update `ios-app/project.yml`:
```yaml
settings:
  PRODUCT_BUNDLE_IDENTIFIER: com.yourcompany.outandabout
```

Then regenerate: `cd ios-app && xcodegen generate`

### 7.3 For CI distribution

Add to GitHub Secrets:
- `APPLE_CERTIFICATE` — Base64-encoded .p12 distribution certificate
- `APPLE_CERTIFICATE_PASSWORD` — Certificate password
- `APPLE_PROVISIONING_PROFILE` — Base64-encoded .mobileprovision
- `APPLE_ID` — Your Apple ID email

---

## 8. Environment Configuration

### Firebase project separation (dev vs prod)

Use Firebase project aliases:

```bash
# Set up aliases
firebase use --add  # select dev project, alias: default
firebase use --add  # select prod project, alias: production

# Deploy to prod
firebase use production
firebase deploy
```

### Cloud Run per-environment

Build separate images tagged `dev` and `prod`. Use different Cloud Run services.

---

## 9. Post-Deployment Checklist

- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed
- [ ] All Cloud Functions deployed successfully
- [ ] Dares seeded (at least 10 active)
- [ ] Cloud Run worker deployed and accessible
- [ ] `render.worker_url` set in Functions config
- [ ] Anonymous auth enabled in Firebase console
- [ ] iOS app builds with real `GoogleService-Info.plist`
- [ ] End-to-end test: create room → join → submit dare → end game → verify reel job created
- [ ] GitHub Actions secrets configured

---

## 10. Troubleshooting

### Functions deployment fails

```bash
# Check Node version
node --version  # should be 20+

# Check build output
cd functions && npm run build
```

### Cloud Run worker times out

Increase timeout: `--timeout 3600` (max 1 hour for Cloud Run)

Increase memory: `--memory 4Gi` for rooms with many submissions

### Firestore permission denied

Check that rules are deployed: `firebase deploy --only firestore:rules`

Verify anonymous auth is enabled in Firebase console.

### iOS build fails: missing GoogleService-Info.plist

Copy from Firebase console (Project Settings → iOS app → Download config file)

### Reel jobs stuck in 'queued' status

1. Check `render.worker_url` config: `firebase functions:config:get`
2. Check Cloud Run service is deployed and healthy
3. Check Cloud Functions logs: `firebase functions:log`
