from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# IMPORT SERVICES AND ROUTER
from backend.app.services.risk_service import risk_service
from backend.app.services.fatigue_service import fatigue_service
from backend.app.routers import ml_api

@asynccontextmanager
async def lifespan(app: FastAPI):
    # LOAD MODELS ON STARTUP
    print("🚀 Loading ML Models...")
    try:
        risk_service.load_model()
        fatigue_service.load_model()
        print("✅ Models Loaded Successfully!")
    except Exception as e:
        print(f"❌ Error loading models: {e}")
    yield
    print("🛑 Shutting down...")

app = FastAPI(title="Project 13 Safety API", lifespan=lifespan)

# CORS (Keep existing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "active", "message": "Safety Platform Backend is Running"}

# REGISTER ROUTER
app.include_router(ml_api.router, tags=["Machine Learning"])