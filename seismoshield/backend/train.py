"""
Training script for the earthquake risk / intensity model.
Step 1 (dataset explorer): inspect files under data/rekoske/ before modeling.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "data" / "rekoske"

# Column name hints (substring match, case-insensitive); exact "mag" counts as magnitude-like
CANDIDATE_SUBSTRINGS = ("magnitude", "lat", "lon", "pgv", "velocity", "vs30")
MAGNITUDE_ALIASES = frozenset({"mag"})


def list_data_files(root: Path) -> list[Path]:
    """All regular files directly under root (non-recursive)."""
    if not root.is_dir():
        return []
    return sorted(p for p in root.iterdir() if p.is_file())


def find_first_csv_or_parquet(root: Path) -> Path | None:
    """First .csv or .parquet file when sorted by name (deterministic)."""
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


def main() -> None:
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


if __name__ == "__main__":
    main()
