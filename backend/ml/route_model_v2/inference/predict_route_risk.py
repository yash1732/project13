"""
Inference entrypoint for Route Risk Classification.
Designed for API / backend usage (one-tap prediction).
"""

import joblib
import pandas as pd

from features.feature_extraction import prepare_features

import os
root = os.path.dirname(os.path.dirname(__file__))

MODEL_PATH = os.path.join(root,'artifacts','route_risk_logreg.joblib')


def predict_route_risk(input_features: dict):
    """
    Predicts route risk label given raw input features.

    input_features: dict with keys:
        route_distance_km
        route_duration_min
        intersection_density
        is_night
        weather_stress_index
        fatigue_score
        shift_duration_hours
    """

    # Convert to DataFrame
    df = pd.DataFrame([input_features])

    # Prepare features (same pipeline as training)
    df_prepared = prepare_features(df, normalize=True)

    # Load model
    model = joblib.load(MODEL_PATH)

    # Prediction
    risk_label = model.predict(df_prepared)[0]
    risk_probs = model.predict_proba(df_prepared)[0]

    return {
        "risk_label": risk_label,
        "risk_probabilities": {
            label: float(prob)
            for label, prob in zip(model.classes_, risk_probs)
        }
    }


if __name__ == "__main__":
    # Example test
    sample_input = {
        "route_distance_km": 8.5,
        "route_duration_min": 42,
        "intersection_density": 1.4,
        "is_night": 1,
        "weather_stress_index": 0.5,
        "fatigue_score": 4,
        "shift_duration_hours": 9
    }

    print(predict_route_risk(sample_input))
    model = joblib.load(MODEL_PATH)
    coef_df = pd.DataFrame(
        model.coef_,
        columns=list(sample_input.keys()),
        index=["Low", "Medium", "High"]) # type: ignore
    print(coef_df)
