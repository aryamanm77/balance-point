# BalancePoint — Senior Health PWA

A Samsung Health-inspired Progressive Web App for senior health monitoring, built with Firebase Authentication, real-time bed telemetry simulation, and guided fitness videos.

## Features

- 🔥 **Firebase Google Sign-In** — Secure authentication, Firestore preference sync
- 📡 **ESP32 Bed Telemetry** — Live 4×4 FSR pressure matrix + TOF sensor simulation
- ❤️ **Vitals Monitoring** — Heart rate, SpO₂, blood pressure, temperature
- 💊 **Medications Manager** — Add/track meds, adherence %, fall-risk multiplier, reminders
- 🌙 **Sleep Analysis** — 7-day Chart.js bars, phase polar chart, restlessness index
- 🎬 **Fitness Video Library** — 30 curated YouTube senior workout videos, 6 categories
- 🔧 **Widget Drawer** — Toggle bento cards on/off, saved to Firestore
- 📲 **PWA** — Service Worker, offline caching, Web App Manifest

## Tech Stack

- Vanilla HTML + CSS + JavaScript (ES Modules, no bundler)
- Firebase v10 (Auth + Firestore) — CDN ESM
- Chart.js v4 — CDN
- Service Worker — cache-first strategy

## Setup

1. **Firebase** — replace config in `js/firebase-init.js` with your project credentials  
2. **Authorized Domains** — add your Vercel domain to Firebase Console → Authentication → Settings → Authorized Domains  
3. **Deploy** — drag `health-dashboard/` folder into Vercel, or connect this repo

## File Structure

```
├── index.html          # Main app shell + login overlay + all modals
├── app.js              # Main ES module orchestrator
├── style.css           # Full design system (dark mode, bento grid, animations)
├── sw.js               # Service Worker (cache-first PWA)
├── manifest.json       # PWA manifest
├── soundwave.png       # Hearing card asset
├── vascular.png        # Vascular card asset
└── js/
    ├── firebase-init.js    # Firebase SDK init
    ├── auth.js             # Google Sign-In, onAuthStateChanged, signOut
    ├── charts.js           # Chart.js: Sleep, HR, SpO2, Cardio, Restlessness
    ├── telemetry.js        # ESP32 FSR bed telemetry simulation
    ├── medications.js      # MedManager: add/remove/remind, fall-risk
    └── widgets.js          # Widget drawer + Firestore layout persistence
```

## Local Development

```bash
python -m http.server 5500
# Open http://localhost:5500
```

> ⚠️ Must be served via HTTP (not `file://`) for Firebase Auth and Service Worker to work.
