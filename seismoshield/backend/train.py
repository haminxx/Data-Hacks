"""
Training script: build PGV labels from Rekoske simulations + USGS query rows,
engineer features (model.add_features), train XGBoost, save artifacts.
Use `python train.py explore` for the legacy dataset file listing.

XGBoost needs OpenMP on macOS (e.g. `brew install libomp`) if import fails.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from model import (
    FEATURES,
    TARGET,
    add_features,
    pgv_to_risk_tier,
)

DATA_DIR = Path(__file__).resolve().parent / "data" / "rekoske"
BACKEND_DIR = Path(__file__).resolve().parent
MODEL_PATH = BACKEND_DIR / "seismoshield_model.joblib"
SCENARIOS_PATH = BACKEND_DIR / "precomputed_scenarios.json"
SEISMOS_NPY = DATA_DIR / "seismos_16_receivers.npy"
QUERY_CSV = DATA_DIR / "query.csv"

# Salton Sea fault demo epicenter (prompt)
SALTON_LAT = 33.19
SALTON_LON = -115.54

# Column hints for explore mode
CANDIDATE_SUBSTRINGS = ("magnitude", "lat", "lon", "pgv", "velocity", "vs30")
MAGNITUDE_ALIASES = frozenset({"mag"})


def list_data_files(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    return sorted(p for p in root.iterdir() if p.is_file())


def find_first_csv_or_parquet(root: Path) -> Path | None:
    tabular = sorted(
        p
        for p in root.iterdir()
        if p.is_file() and p.suffix.lower() in (".csv", ".parquet")
    )
    return tabular[0] if tabular else None


def load_tabular(path: Path) -> pd.DataFrame:
    suf = path.suffix.lower()
    if suf == ".csv":
        return pd.read_csv(path)
    if suf == ".parquet":
        return pd.read_parquet(path)
    raise ValueError(f"Expected .csv or .parquet, got {path}")


def matching_columns(columns: pd.Index) -> list[str]:
    out: list[str] = []
    for col in columns:
        lc = str(col).lower()
        if lc in MAGNITUDE_ALIASES or any(s in lc for s in CANDIDATE_SUBSTRINGS):
            out.append(str(col))
    return out


def explore_dataset() -> None:
    print(f"Data directory: {DATA_DIR}\n")

    all_files = list_data_files(DATA_DIR)
    print("Files in data/rekoske/:")
    if not all_files:
        print("  (empty or missing directory)")
        return
    for f in all_files:
        print(f"  - {f.name}")

    path = find_first_csv_or_parquet(DATA_DIR)
    if path is None:
        print("\nNo .csv or .parquet file found; nothing to load.")
        return

    print(f"\nLoading first tabular file: {path.name}\n")
    df = load_tabular(path)

    print("Shape:", df.shape)
    print("\nColumn names:")
    for c in df.columns:
        print(f"  - {c}")

    print("\nFirst 5 rows:")
    print(df.head().to_string())

    num = df.select_dtypes(include="number")
    print("\nBasic stats (numeric columns, describe):")
    if num.shape[1]:
        print(num.describe().to_string())
    else:
        print("  (no numeric columns)")

    non_num = df.select_dtypes(exclude="number")
    if non_num.shape[1]:
        print("\nNon-numeric columns (value counts top 5 each):")
        for col in non_num.columns:
            vc = non_num[col].value_counts().head(5)
            print(f"\n  {col}:")
            print(vc.to_string())

    matched = matching_columns(df.columns)
    print("\nColumns that look like magnitude, lat, lon, pgv, velocity, vs30:")
    if matched:
        for c in matched:
            print(f"  - {c}")
    else:
        print("  (none matched by substring)")


def build_training_frame() -> pd.DataFrame:
    if not SEISMOS_NPY.is_file():
        raise FileNotFoundError(f"Missing {SEISMOS_NPY}")
    if not QUERY_CSV.is_file():
        raise FileNotFoundError(f"Missing {QUERY_CSV}")

    arr = np.load(SEISMOS_NPY)
    if arr.shape != (16, 600, 500):
        raise ValueError(f"Expected seismos array (16, 600, 500), got {arr.shape}")

    # PGV per receiver, then average across receivers → one PGV per simulation
    pgv_recv = np.max(np.abs(arr), axis=1)
    pgv_sim = pgv_recv.mean(axis=0)
    pgv_scaled = pgv_sim * 100_000.0

    query = pd.read_csv(QUERY_CSV)
    if len(query) < 500:
        raise ValueError(f"query.csv must have at least 500 rows, got {len(query)}")
    df = query.iloc[:500].copy()
    df["pgv"] = pgv_scaled
    return df


def train_model() -> None:
    df = build_training_frame()
    df = add_features(df)

    X = df[FEATURES].astype(np.float64)
    y = df[TARGET].astype(np.float64)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=600,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    print(f"Test RMSE: {rmse:.4f}")
    print(f"Test R²:   {r2:.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")

    depth_ref = float(np.nanmedian(df["depth"].astype(float)))
    if not np.isfinite(depth_ref) or depth_ref <= 0:
        depth_ref = 8.0

    mags = np.linspace(4.0, 7.5, 8)
    scenarios: list[dict] = []
    for mag in mags:
        row = pd.DataFrame(
            {
                "latitude": [SALTON_LAT],
                "longitude": [SALTON_LON],
                "mag": [float(mag)],
                "depth": [depth_ref],
                "pgv": [0.0],
            }
        )
        row = add_features(row)
        x = row[FEATURES].astype(np.float64)
        pred = float(model.predict(x)[0])
        tier = pgv_to_risk_tier(pred)
        scenarios.append(
            {
                "magnitude": float(mag),
                "epicenter_lat": SALTON_LAT,
                "epicenter_lon": SALTON_LON,
                "depth_km": depth_ref,
                "pgv": pred,
                **tier,
            }
        )

    SCENARIOS_PATH.write_text(json.dumps(scenarios, indent=2), encoding="utf-8")
    print(f"Wrote {len(scenarios)} precomputed scenarios to {SCENARIOS_PATH}")


def main() -> None:
    parser = argparse.ArgumentParser(description="SeismoShield training / dataset explore")
    parser.add_argument(
        "command",
        nargs="?",
        default="train",
        choices=("train", "explore"),
        help="train (default): fit XGBoost and save artifacts; explore: list CSV stats",
    )
    args = parser.parse_args()

    if args.command == "explore":
        explore_dataset()
    else:
        train_model()


if __name__ == "__main__":
    main()
