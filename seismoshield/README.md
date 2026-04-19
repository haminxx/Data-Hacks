# SeismoShield — application

This folder contains the **full-stack SeismoShield application**. For the **product overview** (problem, solution, audience, features), see the **[repository root README](../README.md)**.

**Repository:** [github.com/haminxx/Data-Hacks](https://github.com/haminxx/Data-Hacks) · **This app:** `seismoshield/`

---

## Prerequisites

- **Python** 3.10+ (recommended)
- **Node.js** 18+ and npm
- Optional: **Google Maps / Street View** API keys for map embeds (see frontend env vars)

---

## Backend (`backend/`)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Train the model if `seismoshield_model.joblib` is missing:

```bash
python train.py
```

Run the API:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **API root:** [http://localhost:8000](http://localhost:8000)
- **OpenAPI:** [http://localhost:8000/docs](http://localhost:8000/docs)

**Endpoints (summary):** `GET /health`, `POST /predict`, `POST /heatmap`, `POST /insurance`, `GET /demo`, `GET /scenarios`, `GET /financial-projection`, `GET /risk-score`

---

## Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

- **App:** [http://localhost:3000](http://localhost:3000)

### Environment variables

Create `.env.local` as needed (names depend on your `next.config.js` and components):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (default in code: `http://localhost:8000`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps / Street View embeds where used |

---

## Demo scenario (reference)

- **Earthquake:** M6.5, Salton Sea epicenter (~33.19°N, 115.54°W)
- **Building:** UCSD Recreation Center — 9500 Gilman Dr, La Jolla, CA 92093
- **Instant demo payload:** `GET /demo` returns a precomputed scenario from `precomputed_scenarios.json` when present

---

## PWA

The frontend is configured as a **Progressive Web App** via `next-pwa` (disabled in development per typical setup). See `frontend/next.config.js` and `public/manifest.json`.
