import joblib
import numpy as np
import os
from backend.app.core.config import settings

class FatigueService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_map = None

    def load_model(self):
        """Loads model artifacts into memory"""
        if not os.path.exists(settings.FATIGUE_MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {settings.FATIGUE_MODEL_PATH}")
            
        self.model = joblib.load(settings.FATIGUE_MODEL_PATH)
        self.scaler = joblib.load(settings.FATIGUE_SCALER_PATH)
        # Hardcoding map if file is missing, otherwise load it
        # self.label_map = {0: 'Low', 1: 'Medium', 2: 'High'} 
        # Or load from file if you prefer:
        artifact_dir = os.path.dirname(settings.FATIGUE_MODEL_PATH)
        self.label_map = joblib.load(os.path.join(artifact_dir, "label_map.pkl"))
        self.inverse_label_map = {v: k for k, v in self.label_map.items()}

    def predict(self, data: dict):
        if not self.model:
            self.load_model()
            
        features = np.array([[
            data["shift_duration_hours"],
            data["consecutive_work_days"],
            data["night_work_fraction"],
            data["weather_stress_index"],
            data["self_reported_tiredness"]
        ]])

        features_scaled = self.scaler.transform(features) # type: ignore
        probs = self.model.predict_proba(features_scaled)[0] # type: ignore
        predicted_class = np.argmax(probs)

        return {
            "risk_class": self.inverse_label_map[predicted_class],
            "risk_probabilities": {
                "Low": float(probs[0]),
                "Medium": float(probs[1]),
                "High": float(probs[2])
            },
            "risk_score": float(probs[2])  # Probability of High Risk
        }

fatigue_service = FatigueService()