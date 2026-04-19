"""
Model definitions, feature engineering, and risk-tier mapping for SeismoShield.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

REC_GYM_LAT = 32.8786
REC_GYM_LON = -117.2364

EARTH_RADIUS_KM = 6371.0

# Rec Gym Vs30 ~ 280 m/s reference vs 760 m/s rock
SOIL_AMP = 760.0 / 280.0

FEATURES = [
    "mag",
    "dist_epi_km",
    "log_dist",
    "energy_proxy",
    "depth_factor",
    "soil_amp",
]
TARGET = "pgv"


def haversine_km(
    lat1: np.ndarray | float,
    lon1: np.ndarray | float,
    lat2: float,
    lon2: float,
) -> np.ndarray:
    """Great-circle distance (km) from epicenter(s) to a fixed point (lat2, lon2)."""
    lat1 = np.asarray(lat1, dtype=np.float64)
    lon1 = np.asarray(lon1, dtype=np.float64)
    ph1 = np.radians(lat1)
    ph2 = np.radians(lat2)
    dph = np.radians(lat2 - lat1)
    dlmb = np.radians(lon2 - lon1)
    a = np.sin(dph / 2.0) ** 2 + np.cos(ph1) * np.cos(ph2) * np.sin(dlmb / 2.0) ** 2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(np.maximum(1.0 - a, 0.0)))
    return EARTH_RADIUS_KM * c


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add physics-inspired features. Expects columns: latitude, longitude, mag, depth.
    Epicenter is (latitude, longitude); distance is to Rec Gym.
    """
    out = df.copy()
    dist = haversine_km(
        out["latitude"].values,
        out["longitude"].values,
        REC_GYM_LAT,
        REC_GYM_LON,
    )
    out["dist_epi_km"] = np.maximum(dist, 0.01)
    out["log_dist"] = np.log1p(out["dist_epi_km"])
    mag = out["mag"].astype(np.float64)
    denom = np.maximum(out["dist_epi_km"], 0.5)
    out["energy_proxy"] = np.power(10.0, 1.5 * mag) / denom
    depth = out["depth"].astype(np.float64)
    depth = np.where(np.isfinite(depth), depth, 8.0)
    depth = np.maximum(depth, 1e-3)
    out["depth_factor"] = 1.0 / np.log1p(depth)
    out["soil_amp"] = SOIL_AMP
    return out


def feature_row_epicenter_to_site(
    mag: float,
    depth: float,
    epicenter_lat: float,
    epicenter_lon: float,
    site_lat: float,
    site_lon: float,
) -> pd.DataFrame:
    """
    One row of FEATURES for ML inference: epicenter → site distance (km).
    Use (REC_GYM_LAT, REC_GYM_LON) as site for building-level prediction at Rec Gym.
    """
    d = float(
        haversine_km(
            np.array([epicenter_lat], dtype=np.float64),
            np.array([epicenter_lon], dtype=np.float64),
            site_lat,
            site_lon,
        )[0]
    )
    dist_epi_km = float(np.maximum(d, 0.01))
    log_dist = float(np.log1p(dist_epi_km))
    m = float(mag)
    denom = float(np.maximum(dist_epi_km, 0.5))
    energy_proxy = float(np.power(10.0, 1.5 * m) / denom)
    dep = float(depth) if np.isfinite(depth) else 8.0
    dep = max(dep, 1e-3)
    depth_factor = float(1.0 / np.log1p(dep))
    row = {
        "mag": m,
        "dist_epi_km": dist_epi_km,
        "log_dist": log_dist,
        "energy_proxy": energy_proxy,
        "depth_factor": depth_factor,
        "soil_amp": SOIL_AMP,
    }
    return pd.DataFrame([row])


def pgv_to_risk_tier(pgv: float) -> dict[str, Any]:
    """
    Map PGV (cm/s) to display tier. Thresholds are heuristic for demo / hackathon UX.
    """
    x = float(pgv)
    if x < 3:
        return {
            "tier": "Very Low",
            "color": "#22c55e",
            "description": "Ground motion at the site is unlikely to damage well-maintained structures.",
            "building_tips": [
                "Keep emergency kits and a family plan updated.",
                "No structural retrofits required for typical loading at this level.",
            ],
        }
    if x < 10:
        return {
            "tier": "Low",
            "color": "#84cc16",
            "description": "Light shaking possible; minor nonstructural issues in vulnerable buildings.",
            "building_tips": [
                "Secure tall furniture and ceiling fixtures.",
                "Inspect unreinforced masonry and brittle finishes after events.",
            ],
        }
    if x < 25:
        return {
            "tier": "Moderate",
            "color": "#eab308",
            "description": "Moderate velocities may cause nonstructural damage and some structural distress.",
            "building_tips": [
                "Prioritize diaphragm ties and parapet bracing for older construction.",
                "Review egress paths and exterior glass at large openings.",
            ],
        }
    if x < 60:
        return {
            "tier": "High",
            "color": "#f97316",
            "description": "Strong shaking; elevated risk of structural and nonstructural damage.",
            "building_tips": [
                "Consider professional seismic evaluation for pre-1980 lateral systems.",
                "Strengthen soft-story lines and collector elements in large public halls.",
            ],
        }
    return {
        "tier": "Severe",
        "color": "#ef4444",
        "description": "Very strong velocities; significant damage possible without retrofit.",
        "building_tips": [
            "Evacuate per plan after shaking; expect aftershocks.",
            "Engage a structural engineer before reoccupying if damage is visible.",
        ],
    }
