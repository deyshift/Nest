# VeloGarage

Track your bikes. Know when to wrench.

VeloGarage connects to your Strava account to automatically calculate mileage on each bike component — chain, cassette, tires, brake pads, and rotors — so you always know what needs service.

## Architecture

```
velogarage/
├── app/   # Expo (React Native) — iOS, Android, Web
└── api/   # FastAPI (Python) — Strava OAuth proxy
```

## Secrets Management

| Secret | Where it lives | Notes |
|---|---|---|
| `STRAVA_CLIENT_ID` | GitHub Secrets + `api/.env` | Also safe as `EXPO_PUBLIC_STRAVA_CLIENT_ID` in the app (it's public) |
| `STRAVA_CLIENT_SECRET` | GitHub Secrets + `api/.env` **only** | **Never** in the Expo app or its build environment |
| `API_PUBLIC_URL` | GitHub Secrets + `api/.env` | e.g. `https://velogarage-api.up.railway.app` — set Strava's Authorization Callback Domain to this hostname |
| `RAILWAY_TOKEN` | GitHub Secrets | Platform deploy token |

**Local development:** copy `.env.example` → `.env` in both `api/` and `app/`, fill in values.

**CI/CD:** add `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and your deploy platform token to
**GitHub → Settings → Secrets and variables → Actions**. The workflow at
`.github/workflows/velogarage-api.yaml` injects them automatically on push to `main`.

---

## Getting Started

### 1. Create a Strava API Application

1. Go to https://www.strava.com/settings/api
2. Create an application
3. Set **Authorization Callback Domain** to `localhost`
4. Note your **Client ID** and **Client Secret**

### 2. Start the API

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env
uvicorn main:app --reload
```

### 3. Start the Expo App

```bash
cd app
npm install
cp .env.example .env
# Set EXPO_PUBLIC_STRAVA_CLIENT_ID to your Strava Client ID
# Set EXPO_PUBLIC_API_URL to your API URL (http://localhost:8000 for local)
npx expo start
```

Scan the QR code with the Expo Go app, or press `i` for iOS simulator / `a` for Android.

## Deploying the API

The FastAPI backend can be deployed to any platform that runs Python:

- **Railway**: Connect your repo, set env vars, deploy automatically
- **Render**: Free tier available, set `uvicorn main:app --host 0.0.0.0 --port $PORT` as start command
- **Fly.io**: `fly launch` from the `api/` directory

After deploying, update `EXPO_PUBLIC_API_URL` in your app's `.env` to the deployed URL.

## Component Intervals

| Component | Default Interval |
|---|---|
| Chain (wax) | 400 km |
| Chain (dry lube) | 175 km |
| Chain (wet lube) | 400 km |
| Chain (ceramic) | 650 km |
| Cassette | 8,000 km |
| Chainring | 15,000 km |
| Front tire | 4,000 km |
| Rear tire | 3,000 km |
| Brake pads | 2,000 km |
| Rotors | 10,000 km |

All intervals can be overridden per component.

## Privacy

- Strava tokens are stored encrypted on your device (iOS Keychain / Android Keystore)
- Maintenance data is stored locally in SQLite — it never leaves your device
- The API backend is stateless and stores nothing
