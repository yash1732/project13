from fastapi import FastAPI
from pydantic import BaseModel

from ..ml.fatigue_model.inference import predict_workload_risk

app = FastAPI(title="Workload Risk API")

class WorkloadInput(BaseModel):
    shift_duration_hours: float
    consecutive_work_days: int
    night_work_fraction: float
    weather_stress_index: float
    self_reported_tiredness: int

@app.post("/predict/fatigue")
def predict(input_data: WorkloadInput):
    result = predict_workload_risk(input_data.dict())
    return result

