import numpy as np
import joblib
import os

root=os.path.dirname(__file__)

model = joblib.load(os.path.join(root,"artifacts/model.pkl"))
scaler = joblib.load(os.path.join(root,"artifacts/scaler.pkl"))
label_map = joblib.load(os.path.join(root,"artifacts/label_map.pkl"))

inverse_label_map = {v: k for k, v in label_map.items()}

def predict_workload_risk(input_data: dict):
    """
    input_data keys:
    - shift_duration_hours
    - consecutive_work_days
    - night_work_fraction
    - weather_stress_index
    - self_reported_tiredness
    """

    features = np.array([[
        input_data["shift_duration_hours"],
        input_data["consecutive_work_days"],
        input_data["night_work_fraction"],
        input_data["weather_stress_index"],
        input_data["self_reported_tiredness"]
    ]])

    features_scaled = scaler.transform(features)

    probs = model.predict_proba(features_scaled)[0]
    predicted_class = np.argmax(probs)

    return {
        "risk_class": inverse_label_map[predicted_class],
        "risk_probabilities": {
            "Low": float(probs[0]),
            "Medium": float(probs[1]),
            "High": float(probs[2])
        },
        "risk_score": float(probs[2])  # P(High)
    }

if __name__ == "__main__":
    sample_input = {
        "shift_duration_hours": 4.0,
        "consecutive_work_days": 5,
        "night_work_fraction": 0.6,
        "weather_stress_index": 1.0,
        "self_reported_tiredness": 1
    }

    output = predict_workload_risk(sample_input)
    print(output)

