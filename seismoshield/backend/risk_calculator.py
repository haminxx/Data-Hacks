"""
Financial projections and risk scores from USGS catalog (query.csv) near HSS.
"""

from __future__ import annotations

import math
from pathlib import Path

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent
QUERY_CSV = BACKEND_DIR / "data" / "rekoske" / "query.csv"

HSS_LAT = 32.8785
HSS_LON = -117.2417
RADIUS_KM = 50
YEARS_OF_DATA = 23  # 2000-2023

BUILDING_VALUE = 8_000_000

DAMAGE_FACTORS = {
    "m4": 0.005,
    "m5": 0.03,
    "m6": 0.12,
    "m65": 0.25,
    "m7": 0.60,
}

BASE_ANNUAL_PREMIUM = 142_000
PREMIUM_ESCALATION = 0.03


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(
        math.radians(lat2)
    ) * math.sin(d_lon / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def poisson_probability(lambda_rate: float, years: float) -> float:
    if lambda_rate <= 0:
        return 0.0
    return 1 - math.exp(-lambda_rate * years)


def _load_nearby() -> pd.DataFrame:
    if not QUERY_CSV.is_file():
        return pd.DataFrame(columns=["latitude", "longitude", "mag", "dist_km"])
    df = pd.read_csv(QUERY_CSV)
    if "latitude" not in df.columns or "longitude" not in df.columns or "mag" not in df.columns:
        raise ValueError("query.csv must have latitude, longitude, mag")
    df = df.copy()
    df["dist_km"] = df.apply(
        lambda row: haversine(
            float(row["latitude"]),
            float(row["longitude"]),
            HSS_LAT,
            HSS_LON,
        ),
        axis=1,
    )
    return df[df["dist_km"] <= RADIUS_KM].reset_index(drop=True)


nearby_df = _load_nearby()

count_m4 = int(len(nearby_df[nearby_df["mag"] >= 4.0]))
count_m5 = int(len(nearby_df[nearby_df["mag"] >= 5.0]))
count_m6 = int(len(nearby_df[nearby_df["mag"] >= 6.0]))
count_m7 = int(len(nearby_df[nearby_df["mag"] >= 7.0]))

lambda_m4 = count_m4 / YEARS_OF_DATA
lambda_m5 = count_m5 / YEARS_OF_DATA
lambda_m6 = count_m6 / YEARS_OF_DATA
lambda_m7 = count_m7 / YEARS_OF_DATA


def expected_annual_claims(
    lam_m4: float, lam_m5: float, lam_m6: float, lam_m7: float
) -> float:
    p_m4_only = poisson_probability(lam_m4, 1) - poisson_probability(lam_m5, 1)
    p_m5_only = poisson_probability(lam_m5, 1) - poisson_probability(lam_m6, 1)
    p_m6_only = poisson_probability(lam_m6, 1) - poisson_probability(lam_m7, 1)
    p_m7_plus = poisson_probability(lam_m7, 1)

    return (
        p_m4_only * BUILDING_VALUE * DAMAGE_FACTORS["m4"]
        + p_m5_only * BUILDING_VALUE * DAMAGE_FACTORS["m5"]
        + p_m6_only * BUILDING_VALUE * DAMAGE_FACTORS["m6"]
        + p_m7_plus * BUILDING_VALUE * DAMAGE_FACTORS["m7"]
    )


def calculate_premium(year: int) -> float:
    return BASE_ANNUAL_PREMIUM * ((1 + PREMIUM_ESCALATION) ** (year - 1))


def generate_projections() -> list[dict[str, float | int]]:
    annual_claims = expected_annual_claims(lambda_m4, lambda_m5, lambda_m6, lambda_m7)

    yearly_data: list[dict[str, float | int]] = []
    cumulative_premium = 0.0
    cumulative_claims = 0.0

    for year in range(1, 11):
        premium_this_year = calculate_premium(year)
        claims_this_year = annual_claims * (1 + (year - 1) * 0.08)

        cumulative_premium += premium_this_year
        cumulative_claims += claims_this_year

        net_position = cumulative_premium - cumulative_claims

        p_m7_in_year = poisson_probability(lambda_m7, year)
        worst_case = cumulative_premium - (BUILDING_VALUE * DAMAGE_FACTORS["m7"] * p_m7_in_year)

        yearly_data.append(
            {
                "year": year,
                "annual_premium": round(premium_this_year),
                "annual_expected_claims": round(claims_this_year),
                "cumulative_premium": round(cumulative_premium),
                "cumulative_claims": round(cumulative_claims),
                "net_position": round(net_position),
                "worst_case": round(worst_case),
                "p_m5_plus": round(poisson_probability(lambda_m5, year) * 100, 1),
                "p_m6_plus": round(poisson_probability(lambda_m6, year) * 100, 1),
                "p_m7_plus": round(poisson_probability(lambda_m7, year) * 100, 1),
            }
        )

    return yearly_data


def calculate_risk_score() -> dict:
    pgv_score = 72
    fault_score = 80
    soil_score = 60
    historical_freq_score = 85
    seismic_hazard = (
        pgv_score * 0.35
        + fault_score * 0.30
        + soil_score * 0.15
        + historical_freq_score * 0.20
    )

    age_score = 100
    material_score = 95
    stories_score = 85
    ceiling_score = 100
    hazards_score = 90
    building_vulnerability = (
        age_score * 0.30
        + material_score * 0.25
        + stories_score * 0.15
        + ceiling_score * 0.20
        + hazards_score * 0.10
    )

    nearby_count = len(nearby_df)
    freq_score = min(100, (nearby_count / 23) * 10)
    max_mag = float(nearby_df["mag"].max()) if len(nearby_df) > 0 else 0.0
    max_mag_score = min(100, (max_mag - 3.0) / 4.0 * 100)
    damage_history_score = 75
    historical_record = (
        freq_score * 0.50 + max_mag_score * 0.30 + damage_history_score * 0.20
    )

    final_score = (
        seismic_hazard * 0.40
        + building_vulnerability * 0.35
        + historical_record * 0.25
    )

    return {
        "overall": round(min(100, final_score)),
        "seismic_hazard": {
            "score": round(seismic_hazard),
            "weight": 40,
            "sub_factors": [
                {
                    "name": "PGV at M6.5",
                    "value": "8.4 cm/s",
                    "score": pgv_score,
                    "level": "High",
                },
                {
                    "name": "Distance to Rose Canyon Fault",
                    "value": "8 km",
                    "score": fault_score,
                    "level": "High",
                },
                {
                    "name": "Soil Stiffness (Vs30)",
                    "value": "280 m/s",
                    "score": soil_score,
                    "level": "Moderate",
                },
                {
                    "name": "Historical M5+ Events Nearby",
                    "value": f"{count_m5} events / 23yr",
                    "score": historical_freq_score,
                    "level": "High",
                },
            ],
        },
        "building_vulnerability": {
            "score": round(building_vulnerability),
            "weight": 35,
            "sub_factors": [
                {
                    "name": "Year Built",
                    "value": "1970 — Pre-seismic code",
                    "score": age_score,
                    "level": "Severe",
                },
                {
                    "name": "Construction Type",
                    "value": "1970s Brutalist Concrete",
                    "score": material_score,
                    "level": "Severe",
                },
                {
                    "name": "Building Height",
                    "value": "8 Stories",
                    "score": stories_score,
                    "level": "High",
                },
                {
                    "name": "Ceiling Condition",
                    "value": "Water damage + suspended grid",
                    "score": ceiling_score,
                    "level": "Severe",
                },
                {
                    "name": "Wall-mounted Hazards",
                    "value": "TV, projector, screen",
                    "score": hazards_score,
                    "level": "High",
                },
            ],
        },
        "historical_record": {
            "score": round(historical_record),
            "weight": 25,
            "sub_factors": [
                {
                    "name": "Earthquakes within 50km (23yr)",
                    "value": f"{nearby_count} events",
                    "score": round(freq_score),
                    "level": "Severe",
                },
                {
                    "name": "Largest Recorded Nearby",
                    "value": f"M{round(max_mag, 1)}",
                    "score": round(max_mag_score),
                    "level": "High",
                },
                {
                    "name": "Building Damage History",
                    "value": "Concrete spalling documented",
                    "score": damage_history_score,
                    "level": "High",
                },
                {
                    "name": "Fault System Proximity",
                    "value": "Rose Canyon 8km, Elsinore 40km",
                    "score": 80,
                    "level": "High",
                },
            ],
        },
    }
