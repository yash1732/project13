from pydantic import BaseModel, Field

# --- Route Risk Schemas ---
class RouteRiskRequest(BaseModel):
    route_distance_km: float = Field(json_schema_extra={"example": 8.5})
    route_duration_min: float = Field(json_schema_extra={"example": 42.0})
    intersection_density: float = Field(json_schema_extra={"example": 1.4})
    is_night: int = Field(description="1 for night, 0 for day", json_schema_extra={"example": 1})
    weather_stress_index: float = Field(description="0.0 to 1.0", json_schema_extra={"example": 0.5})
    fatigue_score: float = Field(json_schema_extra={"example": 4.0})
    shift_duration_hours: float = Field(json_schema_extra={"example": 9.0})


class RouteRiskResponse(BaseModel):
    risk_label: str
    risk_probabilities: dict[str, float]
    reasons: list


# --- Fatigue Schemas ---
class FatigueRequest(BaseModel):
    shift_duration_hours: float = Field(json_schema_extra={"example": 4.0})
    consecutive_work_days: int = Field(json_schema_extra={"example": 5})
    night_work_fraction: float = Field(json_schema_extra={"example": 0.6})
    weather_stress_index: float = Field(json_schema_extra={"example": 1.0})
    self_reported_tiredness: int = Field(description="1–5 scale", json_schema_extra={"example": 1})


class FatigueResponse(BaseModel):
    risk_class: str
    risk_score: float
    risk_probabilities: dict[str, float]
