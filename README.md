# SeismoShield

**We know your building. We know your risk. We get you out safely.**

SeismoShield is a **Progressive Web App (PWA)** for earthquake awareness: it combines **machine-learned shaking estimates**, **interactive maps and 3D-style simulation**, **emergency-oriented UX**, and **optional enterprise dashboards** so people and organizations can reason about seismic risk at a specific place—not only “was there an earthquake?” but “what could this mean *here*?”

| | |
| --- | --- |
| **Repository** | [github.com/haminxx/Data-Hacks](https://github.com/haminxx/Data-Hacks) |
| **Application code** | [`seismoshield/`](./seismoshield/) |
| **Local web app** | [http://localhost:3000](http://localhost:3000) (after `npm run dev` in `seismoshield/frontend`) |
| **Local API** | [http://localhost:8000](http://localhost:8000) — [interactive docs](http://localhost:8000/docs) |

Deploy the frontend (for example to Vercel or similar) and point `NEXT_PUBLIC_API_URL` at your hosted FastAPI instance when you go beyond local development.

---

## What this is

SeismoShield is a **data-driven earthquake risk experience** built for a **Data Hacks**–style project: a **Next.js 14** frontend (App Router, Tailwind, maps, charts, 3D) backed by a **FastAPI** service that serves predictions, heatmaps, insurance-style tiers, financial projections, and demo scenarios. The product narrative centers on **a real campus context** (UC San Diego) so judges and users can follow a concrete story from landing page → map → building exterior → simulator → emergency guidance → deeper risk and enterprise views.

---

## Problem statement

- **Risk is abstract until it is personal.** Generic earthquake news does not tell you how shaking might translate to **your** building, occupancy, or egress.
- **Tools are fragmented.** Scientific catalogs (e.g. USGS), maps, insurer questionnaires, and emergency checklists often live in different places, with different vocabularies.
- **Decision latency matters.** After a shock—or when planning—stakeholders need **fast, explainable** tiers and next steps, not only raw magnitude and distance.

---

## Solution

SeismoShield **ties location, scenario, and model output together** in one flow:

1. **Scenario input** — magnitude and epicenter (with a strong demo: **M6.5**, Salton Sea region, ~33.19°N, 115.54°W).
2. **Site-specific prediction** — estimated **PGV** (peak ground velocity) and a **risk tier** with human-readable descriptions and **building-oriented tips**.
3. **Spatial context** — **heatmap-style grids** over Southern California to visualize how shaking varies across the region for the same event.
4. **Insurance-style framing** — **vulnerability-adjusted** tiers and **premium multipliers** for a representative large public building (demo: **UCSD Recreation Center**, 9500 Gilman Dr, La Jolla, CA 92093).
5. **Emergency and education** — dedicated flows for **emergency guidance** and a **simulator** experience so non-experts can build intuition.
6. **Deeper analytics** — **financial projection** and **risk score** endpoints driven by historical **USGS**-style event analysis (see API below).

The stack is designed so the UI can run as a **PWA** on mobile browsers while the **API** stays independently deployable and documented via OpenAPI.

---

## Value proposition

- **Clarity:** Tiered risk, colors, and short explanations instead of only engineering units.
- **Speed:** Precomputed **demo** scenario for instant storytelling; fast local API for iteration.
- **Actionability:** Building tips, interior hazard examples (enterprise flows), and emergency-oriented screens.
- **Extensibility:** Clear separation between **frontend**, **FastAPI**, and **model artifacts** (`train.py`, joblib model).

---

## Core values

- **Safety-first storytelling** — prioritize understandable guidance over alarmism.
- **Transparency** — document data sources (e.g. USGS-era catalogs for projections), API surfaces, and demo assumptions.
- **Accessibility of science** — bridge ML outputs and maps to language stakeholders actually use.

---

## Target audience

- **Students and residents** in seismically active regions who want a **guided demo** tied to a real place.
- **Hackathon judges and technical reviewers** who need a **coherent narrative** plus a real repo and API.
- **Campus and facilities stakeholders (prototype)** — **enterprise** routes sketch dashboards, building views, and reporting flows for organizations that manage portfolios of structures.

---

## Key features

| Area | Description |
| --- | --- |
| **Landing & globe / map journey** | Cinematic entry into a **2.5D campus map** and exploration UX (`/`, `/map`). |
| **Risk assessment** | Flows for analyzing a building / scenario and viewing **tier**, **PGV**, and tips (`/risk`, `/risk-assessment`, `/risk/results`). |
| **Exterior context** | **Street View**-style exterior context for the demo building (`/exterior`). |
| **3D simulator** | Immersive **simulator** experience for intuition-building (`/simulator`). |
| **Emergency** | **Emergency guidance** surface (`/emergency`). |
| **Enterprise (demo)** | Login, dashboard, risk assessment, and **HSS** building portal pages under `/enterprise` (demo credentials / emails as implemented in the app). |
| **Backend API** | `POST /predict`, `POST /heatmap`, `POST /insurance`, `GET /demo`, `GET /scenarios`, `GET /financial-projection`, `GET /risk-score`, `GET /health`. |

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, PWA (`next-pwa`), Map/3D libraries (e.g. Deck.gl, Three.js ecosystem), charts (Recharts).
- **Backend:** Python, FastAPI, Uvicorn, scikit-learn / XGBoost pipeline (see `seismoshield/backend/train.py` and `model.py`).
- **Design:** Dark navy **#0F172A**, accent blue **#1A56DB**, light text — consistent across marketing and API root page.

---

## Repository layout

```
Data-Hacks/
├── README.md                 ← You are here (project overview)
├── seismoshield/
│   ├── README.md             ← Developer setup (backend + frontend)
│   ├── backend/              ← FastAPI app, model, data, training
│   └── frontend/             ← Next.js PWA
├── SeismoShield_CursorPrompts.md
├── SeismoShield_RiskAssessment.md
└── SeismoShield_SimulatorPrompt.md
```

---

## Quick start

Detailed commands and environment variables are in **[`seismoshield/README.md`](./seismoshield/README.md)**. In short:

1. **Backend:** Python venv, `pip install -r requirements.txt`, run `train.py` if the joblib model is missing, then `uvicorn main:app --reload --port 8000` from `seismoshield/backend`.
2. **Frontend:** `npm install` and `npm run dev` from `seismoshield/frontend`, with optional `NEXT_PUBLIC_API_URL` and map keys as documented in the subfolder README.

---

## Data & modeling (high level)

- The backend loads a **trained model** (`seismoshield_model.joblib`) and maps predicted **PGV** to **risk tiers**, colors, and copy.
- **Feature engineering** includes distance from epicenter, magnitude, depth-related factors, and **soil amplification** assumptions documented in `model.py` (e.g. Rec Gym Vs30 reference).
- **Financial projection** logic uses historical event rates near a configured site (see `risk_calculator.py` and `GET /financial-projection`).

---

## Contributing & license

Issues and PRs are welcome via [haminxx/Data-Hacks](https://github.com/haminxx/Data-Hacks). Add or adjust **live demo URLs** in this README once the app is deployed publicly.

*(Add an explicit open-source license file to the repo if you want standard redistribution terms; this README does not substitute for a LICENSE file.)*
