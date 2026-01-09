"""
Feature extraction pipeline for route risk classification.

This module prepares raw or processed datasets
for ML training and inference.
"""

import pandas as pd
from features.feature_utils import (
    validate_features,
    clip_feature_ranges,
    normalize_continuous_features
)


def prepare_features(
    df: pd.DataFrame,
    normalize: bool = True
) -> pd.DataFrame:
    """
    Full feature preparation pipeline:
    1. Validate schema
    2. Clip outliers
    3. Normalize continuous features (optional)
    """

    # Step 1 — Schema validation
    validate_features(df)

    # Step 2 — Clip to realistic bounds
    df = clip_feature_ranges(df)

    # Step 3 — Normalize if requested
    if normalize:
        df = normalize_continuous_features(df)

    return df


def split_features_and_label(
    df: pd.DataFrame,
    label_col: str = "route_risk_label"
):
    """
    Splits dataframe into X (features) and y (labels).
    """
    X = df.drop(columns=[label_col])
    y = df[label_col]
    return X, y
 