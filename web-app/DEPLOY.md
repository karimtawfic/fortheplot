# Free Deployment Guide

The web PWA runs on **$0** using:

- **Firebase Spark plan** — Firestore + Auth + Storage (no credit card required)
- **Vercel Hobby plan** — hosting + serverless API routes (free)

---

## 1. Create a Firebase project (free Spark plan)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Enable these services (all included in Spark plan):
   - **Authentication** → enable **Anonymous**
   - **Firestore Database** → start in **production mode**
   - **Storage** → start in **production mode**
3. Deploy the security rules and indexes:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add   # pick your project
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules
   ```

## 2. Get a service account key

1. Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**
2. Save the downloaded JSON file somewhere safe (never commit it)

## 3. Seed the dares collection

```bash
cd web-app
npm install
export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/service-account.json)"
npm run seed
```

You should see `✅ Seeded 30 dares to Firestore.`

## 4. Deploy to Vercel

1. Push this repo to GitHub
2. [vercel.com/new](https://vercel.com/new) → **Import** the repo
3. **Framework preset**: Vite
4. **Root directory**: `web-app`
5. Add **Environment Variables** (from your Firebase project settings → General → "Your apps" → Web app config):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```
6. Also add this secret (used by the `/api/*` routes):
   ```
   FIREBASE_SERVICE_ACCOUNT    # paste the ENTIRE JSON content of the service account key
   ```
7. Click **Deploy**

## 5. Done

Your game is live at `https://your-project.vercel.app`.

---

## Cost ceiling (Spark + Hobby)

| Resource | Free limit |
|---|---|
| Firestore reads | 50,000/day |
| Firestore writes | 20,000/day |
| Firestore storage | 1 GiB |
| Storage uploads | 1 GB/day |
| Storage total | 5 GB |
| Vercel bandwidth | 100 GB/month |
| Vercel serverless invocations | 100 GB-hours/month |

If you exceed Spark plan limits, Firestore returns errors instead of billing — so you **cannot** be charged without explicitly upgrading.
