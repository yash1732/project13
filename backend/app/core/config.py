import os
from pathlib import Path

# Get the base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings:
    PROJECT_NAME: str = "Gig Worker Safety and Support Platform"
    VERSION: str = "1.0.0"
    
    # Paths to ML Models - Dynamic and Safe
    ML_DIR = BASE_DIR / "backend" / "ml"
    
    # Route Risk Model Paths (V2)
    ROUTE_MODEL_PATH = ML_DIR / "route_risk" / "artifacts" / "route_risk_logreg.joblib"
    ROUTE_SCALER_PATH = ML_DIR / "route_risk" / "artifacts" / "scaler.pkl" # If exists in V2
    
    # Fatigue Model Paths
    FATIGUE_MODEL_PATH = ML_DIR / "fatigue" / "artifacts" / "model.pkl"
    FATIGUE_SCALER_PATH = ML_DIR / "fatigue" / "artifacts" / "scaler.pkl"
    
    # Incident Data Path
    DB_PATH = BASE_DIR / "backend" / "app" / "data" / "incidents.json"

settings = Settings()