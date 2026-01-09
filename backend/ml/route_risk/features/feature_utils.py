"""
Utility functions for route risk feature processing.
All features are designed to be auto-extracted with zero user input.
"""

import numpy as np
import pandas as pd


REQUIRED_FEATURES = [
    "route_distance_km",
    "route_duration_min",
    "intersection_density",
    "is_night",
    "weather_stress_index",
    "fatigue_score",
    "shift_duration_hours"
]


def validate_features(df: pd.DataFrame) -> None:
    """
    Ensures all required features are present.
    """
    missing = [f for f in REQUIRED_FEATURES if f not in df.columns]
    if missing:
        raise ValueError(f"Missing required features: {missing}")


def clip_feature_ranges(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clips features to realistic bounds to avoid out-of-distribution issues.
    """
    df = df.copy()

    df["route_distance_km"] = df["route_distance_km"].clip(0.5, 40)
    df["route_duration_min"] = df["route_duration_min"].clip(3, 180)
    df["intersection_density"] = df["intersection_density"].clip(0.05, 5.0)
    df["fatigue_score"] = df["fatigue_score"].clip(1, 5)
    df["shift_duration_hours"] = df["shift_duration_hours"].clip(1, 16)
    df["weather_stress_index"] = df["weather_stress_index"].clip(0, 1)
    df["is_night"] = df["is_night"].astype(int)

    return df


def normalize_continuous_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies min-max normalization to continuous features.
    NOTE: This is optional for Logistic Regression but improves stability.
    """
    df = df.copy()

    continuous = [
        "route_distance_km",
        "route_duration_min",
        "intersection_density",
        "shift_duration_hours"
    ]

    for col in continuous:
        min_val = df[col].min()
        max_val = df[col].max()
        if max_val > min_val:
            df[col] = (df[col] - min_val) / (max_val - min_val)

    return df
