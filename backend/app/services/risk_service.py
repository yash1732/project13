import joblib
import pandas as pd
import sys
import os
from app.core.config import settings

# --- MAGIC: Add your ML folder to python path so we can import 'features' ---
sys.path.append(str(settings.ML_DIR / "route_risk"))

# Now we can import your custom pipeline
try:
    from features.feature_extraction import prepare_features
except ImportError as e:
    print(f"⚠️ WARNING: Could not import prepare_features. Check path: {e}")

class RiskService:
    def __init__(self):
        self.model = None

    def load_model(self):
        if not os.path.exists(settings.ROUTE_MODEL_PATH):
            raise FileNotFoundError(f"Route model missing at {settings.ROUTE_MODEL_PATH}")
        self.model = joblib.load(settings.ROUTE_MODEL_PATH)

    def predict(self, data: dict):
        if not self.model:
            self.load_model()

        # Convert input dict to DataFrame
        df = pd.DataFrame([data])

        # Run your custom feature extraction
        df_prepared = prepare_features(df, normalize=True)

        # Predict
        risk_label = self.model.predict(df_prepared)[0]
        risk_probs = self.model.predict_proba(df_prepared)[0]

        return {
            "risk_label": risk_label,
            "risk_probabilities": {
                label: float(prob)
                for label, prob in zip(self.model.classes_, risk_probs)
            }
        }

risk_service = RiskService()