import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  # <--- CRITICAL IMPORT
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ==========================================
# 1. PATH SETUP
# ==========================================
# We ensure Python can find all your ML modules
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
from backend.app.routers import incident_api  # <--- Ensure this is imported

# Import SOS App (Safe Import)
try:
    from backend.ml.SOS.sos_api import app as sos_app
except ImportError as e:
    print(f"⚠️ Warning: Could not import SOS API: {e}")
    sos_app = None

# ==========================================
# 3. LIFESPAN (Startup Logic)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n🚀 STARTING UNIFIED SAFETY SERVER...")
    try:
        print("   -> Loading Route Risk Model...")
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
app = FastAPI(title="Gig Worker Safety Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 5. REGISTER ROUTES
# ==========================================

# A. SOS Service
if sos_app:
    app.include_router(sos_app.router, tags=["SOS Service"])

# B. ML Services
app.include_router(ml_api.router, tags=["Risk & Fatigue"])
app.include_router(incident_api.router, tags=["Incident AI"])

# C. Serve Generated Reports (CRITICAL FOR DOWNLOADS)
# This lets the frontend access: http://localhost:8000/data/user_123/report.docx
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
        "modules": ["SOS", "Route Risk", "Fatigue", "Incident AI"]
    }