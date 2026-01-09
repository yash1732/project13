from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import RouteRiskRequest, RouteRiskResponse, FatigueRequest, FatigueResponse
from backend.app.services.risk_service import risk_service
from backend.app.services.fatigue_service import fatigue_service

router = APIRouter()

@router.post("/predict/route", response_model=RouteRiskResponse)
async def predict_route_risk(request: RouteRiskRequest):
    try:
        # Convert Pydantic model to dict
        result = risk_service.predict(request.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/fatigue", response_model=FatigueResponse)
async def predict_fatigue(request: FatigueRequest):
    try:
        result = fatigue_service.predict(request.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))