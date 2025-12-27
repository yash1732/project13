# Overview

This dataset contains **synthetic workload risk scenarios for delivery gig workers**.  
Each row represents a hypothetical work session characterized by workload, timing, and environmental conditions.

> **Important**  
> This dataset does **not** represent medical fatigue, health status, or psychological conditions.  
> It is intended only to model **relative workload risk** for research and hackathon demonstration purposes.

---

## Features

| Column Name | Description |
|-----------|-----------|
| `shift_duration_hours` | Total hours worked in the session (2.0–12.0) |
| `consecutive_work_days` | Number of days worked without a full break (1–7) |
| `night_work_fraction` | Fraction of shift occurring during night hours (0.0–1.0) |
| `weather_stress_index` | Environmental stress level: 0.0 (clear), 0.5 (rain/heat), 1.0 (extreme) |
| `self_reported_tiredness` | Worker-reported tiredness level (1–5) |
| `workload_risk_label` | Relative workload risk category: **Low / Medium / High** |

---

## Label Description

`workload_risk_label` indicates **relative workload risk**, derived from combinations of:

- shift intensity  
- time and scheduling patterns  
- environmental conditions  
- self-reported tiredness

### Labels are synthetic

- Generated using transparent scoring logic with controlled randomness  
- Used only to learn **relative importance of workload factors**
- Refer data_generation.py

---

## Intended Use

- Training **explainable ML models** for workload risk scoring  
- Demonstration of **responsible AI in safety-focused systems**  
- Hackathon and research prototyping

---

## Limitations

- No real-world ground truth  
- Not suitable for **medical, legal, or employment decisions**  
- Results should be interpreted **qualitatively**, not diagnostically

---

## Ethical Notice

The dataset intentionally avoids:

- biometric features  
- behavioral tracking  
- surveillance-based attributes

This helps prevent misuse or **worker profiling**.
