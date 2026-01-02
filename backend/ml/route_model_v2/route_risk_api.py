from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


from inference.predict_route_risk import predict_route_risk
from inference.risk_reasoning import get_top_risk_reasons

app = FastAPI(
    title="Route Risk API",
    description="One-tap route risk estimation for gig workers",
    version="1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # OK for demo/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Request Schema
# -------------------------
class RouteRiskRequest(BaseModel):
    route_distance_km: float
    route_duration_min: float
    intersection_density: float
    is_night: int
    weather_stress_index: float
    fatigue_score: int
    shift_duration_hours: float


# -------------------------
# Response Schema
# -------------------------
class RouteRiskResponse(BaseModel):
    risk_label: str
    risk_probabilities: dict
    reasons: list


# -------------------------
# API Endpoint
# -------------------------
@app.post("/api/risk/route", response_model=RouteRiskResponse)
def predict(data: RouteRiskRequest):
    input_features = data.dict()

    prediction = predict_route_risk(input_features)
    reasons = get_top_risk_reasons(input_features)

    return {
        "risk_label": prediction["risk_label"],
        "risk_probabilities": prediction["risk_probabilities"],
        "reasons": reasons
    }
