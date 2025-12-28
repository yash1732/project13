"""
Endpoint: POST /api/risk/route
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from ..ml.route_model.inference import get_risk_prediction

app = FastAPI(title="Route Risk Scoring API", version="1.0.0")

class RouteRiskRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    day_of_week: str
    weather: str
    road_type: str
    speed_limit: int = 50
    
    @validator('day_of_week')
    def validate_day(cls, v):
        valid = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if v not in valid:
            raise ValueError(f'Must be one of: {", ".join(valid)}')
        return v
    
    @validator('weather')
    def validate_weather(cls, v):
        valid = ['Fine', 'Cloudy', 'Rainy','Foggy']
        if v not in valid:
            raise ValueError(f'Must be one of: {", ".join(valid)}')
        return v

class RouteRiskResponse(BaseModel):
    risk_level: str
    confidence: float
    explanation: str
    timestamp: str

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/api/risk/route", response_model=RouteRiskResponse)
async def predict_route_risk(request: RouteRiskRequest):
    """POST /api/risk/route - Predict route risk"""
    try:
        result = get_risk_prediction(
            request.hour, request.day_of_week, request.weather,
            request.road_type, request.speed_limit
        )
        result["timestamp"] = datetime.now().isoformat()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)