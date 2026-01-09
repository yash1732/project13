import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ==========================================
# 1. PATH SETUP
# ==========================================
# Ensure Python can find your ML modules (Incident AI, SOS, Route Risk)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR / "backend" / "ml" / "route_risk"))
sys.path.append(str(BASE_DIR / "backend" / "ml" / "SOS"))
sys.path.append(str(BASE_DIR / "backend" / "ml" / "incident_ai"))

# ==========================================
# 2. IMPORTS
# ==========================================
from backend.app.services.risk_service import risk_service
from backend.app.services.fatigue_service import fatigue_service
from backend.app.routers import ml_api
# Import the new Incident Router (Make sure you created this file!)
from backend.app.routers import incident_api 

# Import SOS App
try:
    from backend.ml.SOS.sos_api import app as sos_app
except ImportError as e:
    print(f"⚠️ Warning: Could not import SOS API: {e}")
    sos_app = None

# ==========================================
# 3. LIFESPAN (MODEL LOADING)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n🚀 STARTING UNIFIED SAFETY SERVER...")
    try:
        print("   -> Loading Fatigue Model...")
        fatigue_service.load_model()
        print("✅ Core ML Models Loaded!")
    except Exception as e:
        print(f"❌ Error loading ML models: {e}")
    yield
    print("🛑 Shutting down...")

# ==========================================
# 4. MAIN APP SETUP
# ==========================================
app = FastAPI(title="Project 13 Safety API (Unified)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 5. REGISTER ROUTES (THE FIX)
# ==========================================

# A. Merge SOS Routes (Using include_router avoids shadowing)
if sos_app:
    # This adds /api/sos/trigger to our main app safely
    app.include_router(sos_app.router, tags=["SOS Service"])

# B. Include other ML Routers
app.include_router(ml_api.router, tags=["Risk & Fatigue"])
app.include_router(incident_api.router, tags=["Incident AI"])

# C. Serve Generated Reports (Static Files)
# Access at: http://localhost:8000/data/user_id/filename.docx
data_dir = os.path.join(str(BASE_DIR), "backend", "data")
os.makedirs(data_dir, exist_ok=True)
app.mount("/data", StaticFiles(directory=data_dir), name="data")

# ==========================================
# 6. HEALTH CHECK
# ==========================================
@app.get("/")
def health_check():
    return {
        "status": "active", 
        "system": "Unified Backend", 
        "available_modules": ["SOS", "Route Risk", "Fatigue", "Incident AI"]
    }

# vicorn backend.app.main:app --reload