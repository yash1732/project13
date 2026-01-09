import sys
import os
from backend.app.core.config import settings

# --- CRITICAL: Add the ML folder to the system path ---
# This allows your scripts to say "from features import..." without crashing
sys.path.append(str(settings.ML_DIR / "route_risk"))

# --- Imports from YOUR existing files ---
try:
    from inference.predict_route_risk import predict_route_risk
    from inference.risk_reasoning import get_top_risk_reasons
    print("✅ Route Risk modules loaded successfully")
except ImportError as e:
    print(f"❌ Error importing Route Risk modules: {e}")
    # We don't crash here, but the API will fail if called

class RiskService:
    def predict(self, data: dict):
        # 1. Use YOUR existing function to get the prediction
        # (It handles model loading internally)
        prediction = predict_route_risk(data)
        
        # 2. Use YOUR existing function to get the reasons
        reasons = get_top_risk_reasons(data)

        # 3. Combine them for the API response
        return {
            "risk_label": prediction["risk_label"],
            "risk_probabilities": prediction["risk_probabilities"],
            "reasons": reasons
        }

risk_service = RiskService()