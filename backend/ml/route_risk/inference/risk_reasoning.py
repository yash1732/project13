"""
Explainability module for Route Risk predictions.
Maps model coefficients to human-readable reasons.
"""

import joblib
import numpy as np
import os

root = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(root,'artifacts','route_risk_logreg.joblib')

FEATURE_NAMES = [
    "route_distance_km",
    "route_duration_min",
    "intersection_density",
    "is_night",
    "weather_stress_index",
    "fatigue_score",
    "shift_duration_hours"
]


HUMAN_READABLE_REASONS = {
    "route_distance_km": "Longer route increases exposure time",
    "route_duration_min": "Longer duration increases fatigue and risk",
    "intersection_density": "High number of intersections increases conflict points",
    "is_night": "Night riding reduces visibility",
    "weather_stress_index": "Adverse weather increases accident risk",
    "fatigue_score": "High rider fatigue reduces reaction time",
    "shift_duration_hours": "Long working hours increase exhaustion"
}


def get_top_risk_reasons(input_features: dict, top_k: int = 3):
    """
    Returns top contributing reasons for the predicted risk.
    """

    model = joblib.load(MODEL_PATH)

    # Use coefficients of the highest-risk class (usually 'High')
    class_index = list(model.classes_).index("High")
    coefs = model.coef_[class_index]

    feature_values = np.array([input_features[f] for f in FEATURE_NAMES])
    contributions = coefs * feature_values

    ranked_idx = np.argsort(np.abs(contributions))[::-1][:top_k]

    reasons = []
    for idx in ranked_idx:
        feature = FEATURE_NAMES[idx]
        reasons.append(HUMAN_READABLE_REASONS[feature])

    return reasons


if __name__ == "__main__":
    sample_input = {
        "route_distance_km": 8.5,
        "route_duration_min": 42,
        "intersection_density": 1.4,
        "is_night": 1,
        "weather_stress_index": 0.5,
        "fatigue_score": 4,
        "shift_duration_hours": 9
    }

    print(get_top_risk_reasons(sample_input))
