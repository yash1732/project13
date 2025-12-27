### Workload Risk API

Endpoint: POST /predict/fatigue

Input JSON:
{
  "shift_duration_hours": number,
  "consecutive_work_days": number,
  "night_work_fraction": number,
  "weather_stress_index": number,
  "self_reported_tiredness": number
}
> can refer fatigue_model/data/readme.md for more info.

Output JSON:
{
  "risk_class": "Low | Medium | High",
  "risk_probabilities": {
    "Low": number,
    "Medium": number,
    "High": number
  },
  "risk_score": number
}
