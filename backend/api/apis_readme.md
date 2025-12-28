### Workload Risk API

Endpoint: POST /api/risk/fatigue

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
---
### Route risk api

Endpoint : POST /api/risk/route

Input JSON:
{
  "hour": number,              // Required: Hour of day (0-23)
  "day_of_week": string,       // Required: Day name
  "weather": string,           // Required: Weather condition
  "road_type": string,         // Required: Type of road
  "speed_limit": number        // Optional: Speed limit in kmph (default: 50)
}

> can refer risk_model/data/readme.md for more info.

Output JSON:
{
  "risk_level": string,        // "Low" | "Medium" | "High"
  "confidence": number,        // 0.0 to 1.0
  "explanation": string,       // Human-readable explanation
  "timestamp": string          // ISO 8601 timestamp
}
