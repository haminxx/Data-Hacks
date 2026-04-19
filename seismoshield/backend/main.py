"""
FastAPI service: risk prediction, heatmap grid, insurance, demo & scenarios.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from model import (
    FEATURES,
    REC_GYM_LAT,
    REC_GYM_LON,
    feature_row_epicenter_to_site,
    pgv_to_risk_tier,
)

import risk_calculator as rc

BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PATH = BACKEND_DIR / "seismoshield_model.joblib"
SCENARIOS_PATH = BACKEND_DIR / "precomputed_scenarios.json"

# When request omits depth, use a typical crustal depth (km)
DEFAULT_DEPTH_KM = 8.25

# Large public assembly, ~1980s — vulnerability bump for insurance (PGV multiplier)
REC_GYM_VULNERABILITY_MULT = 1.12


class EarthquakeBody(BaseModel):
    magnitude: float = Field(..., ge=0.0, le=10.0)
    epicenter_lat: float = Field(..., ge=-90.0, le=90.0)
    epicenter_lon: float = Field(..., ge=-180.0, le=180.0)


def _predict_pgv_at_site(
    model: Any,
    mag: float,
    depth: float,
    epicenter_lat: float,
    epicenter_lon: float,
    site_lat: float,
    site_lon: float,
) -> float:
    X = feature_row_epicenter_to_site(
        mag, depth, epicenter_lat, epicenter_lon, site_lat, site_lon
    )
    return float(model.predict(X[FEATURES].astype(np.float64))[0])


def _insurance_tier_and_premium(tier_label: str) -> tuple[str, float]:
    """Rec Gym–style large public building: map risk tier → insurance band + multiplier."""
    mapping: dict[str, tuple[str, float]] = {
        "Very Low": ("Tier 4 — Low Risk Rate", 0.92),
        "Low": ("Tier 4 — Low Risk Rate", 1.0),
        "Moderate": ("Tier 3 — Standard Rate", 1.22),
        "High": ("Tier 2 — High Risk Surcharge", 1.58),
        "Severe": ("Tier 1 — Specialist Coverage Required", 2.15),
    }
    return mapping.get(tier_label, ("Tier 3 — Standard Rate", 1.15))


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. Run train.py first."
        )
    app.state.model = joblib.load(MODEL_PATH)
    if not SCENARIOS_PATH.is_file():
        app.state.scenarios = []
    else:
        app.state.scenarios = json.loads(SCENARIOS_PATH.read_text(encoding="utf-8"))
    yield


app = FastAPI(title="SeismoShield API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def api_root() -> str:
    """Avoid a bare 404 when someone opens the API host in a browser."""
    return """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>SeismoShield API</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:36rem;line-height:1.5;background:#0f172a;color:#e2e8f0">
  <h1 style="margin-top:0">SeismoShield API</h1>
  <p>This port serves the <strong>backend</strong>. The web UI runs separately (usually Next.js on port <strong>3000</strong> or the port printed by <code>npm run dev</code>).</p>
  <ul>
    <li><a href="/docs" style="color:#60a5fa">Interactive API docs</a></li>
    <li><a href="/financial-projection" style="color:#60a5fa">GET /financial-projection</a></li>
    <li><a href="/risk-score" style="color:#60a5fa">GET /risk-score</a></li>
  </ul>
</body>
</html>"""


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(body: EarthquakeBody) -> dict[str, Any]:
    model = app.state.model
    pgv = _predict_pgv_at_site(
        model,
        body.magnitude,
        DEFAULT_DEPTH_KM,
        body.epicenter_lat,
        body.epicenter_lon,
        REC_GYM_LAT,
        REC_GYM_LON,
    )
    risk = pgv_to_risk_tier(pgv)
    return {"pgv": pgv, **risk}


@app.post("/heatmap")
def heatmap(body: EarthquakeBody) -> dict[str, list[dict[str, Any]]]:
    model = app.state.model
    lat_min, lat_max = 32.35, 35.0
    lon_min, lon_max = -120.75, -114.05
    lats = np.linspace(lat_min, lat_max, 25)
    lons = np.linspace(lon_min, lon_max, 25)
    points: list[dict[str, Any]] = []
    for lat in lats:
        for lon in lons:
            pgv = _predict_pgv_at_site(
                model,
                body.magnitude,
                DEFAULT_DEPTH_KM,
                body.epicenter_lat,
                body.epicenter_lon,
                float(lat),
                float(lon),
            )
            tier = pgv_to_risk_tier(pgv)
            points.append(
                {
                    "lat": float(lat),
                    "lon": float(lon),
                    "pgv": pgv,
                    "tier": tier["tier"],
                    "color": tier["color"],
                }
            )
    return {"points": points}


@app.post("/insurance")
def insurance(body: EarthquakeBody) -> dict[str, Any]:
    model = app.state.model
    pgv = _predict_pgv_at_site(
        model,
        body.magnitude,
        DEFAULT_DEPTH_KM,
        body.epicenter_lat,
        body.epicenter_lon,
        REC_GYM_LAT,
        REC_GYM_LON,
    )
    adj_pgv = pgv * REC_GYM_VULNERABILITY_MULT
    risk = pgv_to_risk_tier(adj_pgv)
    ins_label, premium_mult = _insurance_tier_and_premium(risk["tier"])
    return {
        "pgv": pgv,
        "adjusted_pgv": adj_pgv,
        "vulnerability_multiplier": REC_GYM_VULNERABILITY_MULT,
        "tier": risk["tier"],
        "color": risk["color"],
        "description": risk["description"],
        "building_tips": risk["building_tips"],
        "insurance_tier": ins_label,
        "premium_multiplier": premium_mult,
    }


@app.get("/scenarios")
def scenarios() -> list[dict[str, Any]]:
    return list(app.state.scenarios)


@app.get("/financial-projection")
def financial_projection() -> dict[str, Any]:
    projections = rc.generate_projections()
    risk_scores = rc.calculate_risk_score()

    return {
        "building": "HSS Room 1345, UCSD",
        "data_source": "USGS Earthquake Hazards Program 2000-2023",
        "events_analyzed": len(rc.nearby_df),
        "years_of_data": rc.YEARS_OF_DATA,
        "annual_rates": {
            "m4_plus": round(rc.count_m4 / rc.YEARS_OF_DATA, 2),
            "m5_plus": round(rc.count_m5 / rc.YEARS_OF_DATA, 2),
            "m6_plus": round(rc.count_m6 / rc.YEARS_OF_DATA, 2),
            "m7_plus": round(rc.count_m7 / rc.YEARS_OF_DATA, 2),
        },
        "yearly_projections": projections,
        "risk_scores": risk_scores,
        "interior_hazards": [
            {
                "hazard": "Ceiling projector",
                "location": "Center ceiling",
                "risk": "SEVERE",
                "action": "Anchor to structural concrete",
                "cost": 2400,
            },
            {
                "hazard": "Water-damaged ceiling tile",
                "location": "NW ceiling corner",
                "risk": "HIGH",
                "action": "Replace + inspect above",
                "cost": 800,
            },
            {
                "hazard": "Wall-mounted TV",
                "location": "Blue wall",
                "risk": "HIGH",
                "action": "Add safety straps",
                "cost": 150,
            },
            {
                "hazard": "Projection screen bracket",
                "location": "Wall bracket",
                "risk": "HIGH",
                "action": "Add secondary anchor",
                "cost": 300,
            },
            {
                "hazard": "HVAC unit",
                "location": "Corner ceiling",
                "risk": "MODERATE",
                "action": "Secure mounting",
                "cost": 500,
            },
            {
                "hazard": "Mobile chairs and tables",
                "location": "Throughout room",
                "risk": "MODERATE",
                "action": "Replace with fixed furniture",
                "cost": 12000,
            },
        ],
        "insurance_recommendation": {
            "tier": "Tier 1 — Specialist Coverage Required",
            "policy_type": "Earthquake Specialist Policy",
            "minimum_coverage": 2_000_000,
            "premium_multiplier": 2.5,
            "annual_premium": 142_000,
            "action_items": [
                "Structural retrofit assessment required before renewal",
                "Secure or remove ceiling-mounted projector immediately",
                "Anchor all wall-mounted equipment to structural elements",
            ],
        },
    }


@app.get("/risk-score")
def risk_score() -> dict[str, Any]:
    return rc.calculate_risk_score()


@app.get("/demo")
def demo() -> dict[str, Any]:
    rows: list[dict[str, Any]] = list(app.state.scenarios)
    if not rows:
        return {}
    exact = next((r for r in rows if abs(float(r.get("magnitude", 0)) - 6.5) < 1e-9), None)
    if exact is not None:
        return exact
    return min(rows, key=lambda r: abs(float(r.get("magnitude", 0)) - 6.5))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
