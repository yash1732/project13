# Route Risk Classification Module

This module is part of the **Gig Worker Safety & Support Platform** and focuses on **preventive safety** by estimating the **relative risk of a delivery route** before a rider starts their journey.

The goal is **not navigation** and **not accident prediction**, but a fast, explainable **risk warning system** designed for gig workers who are already under time pressure.

---

## 🎯 Why This Module Exists

Navigation apps optimize for **speed and ETA**.  
This module optimizes for **worker safety under real-world stress**.

A rider should be able to:
- Tap once
- Instantly know if a route is **Low / Medium / High risk**
- Understand *why* (in one line)

No forms. No configuration. No friction.

---

## 🧠 Core Idea

**Route Risk = Route Exposure × Environment × Rider State**

We combine:
- Route characteristics
- Time & environmental stress
- Rider fatigue indicators

Using **lightweight, explainable ML**.

---

## 🧩 Features Used (Zero User Input)

All features are auto-extracted or already available in the system.

| Feature | Description |
|------|------------|
| route_distance_km | Total route length |
| route_duration_min | Estimated travel duration |
| intersection_density | Intersections per km (conflict proxy) |
| is_night | Night-time indicator |
| weather_stress_index | Environmental stress (0 / 0.5 / 1) |
| fatigue_score | Rider fatigue (1–5) |
| shift_duration_hours | Hours worked in current shift |

---

## 🧪 Data Strategy

- Entirely **synthetic and proxy-based**
- No personal data
- No accident records
- No real-time traffic dependency

### Datasets
- `data/raw/route_risk_synthetic_base.csv` (~300 rows)
- `data/processed/route_risk_expanded_10k.csv` (~10,000 rows)

Labels are generated using **human-intuitive safety logic**, not random noise.

---

## 🤖 Model Choice

- **Logistic Regression (Multiclass)**
- Chosen for:
  - Explainability
  - Stability
  - Fast training
  - Judge-friendly reasoning

This model outputs:
- Risk label: **Low / Medium / High**
- Class probabilities
- Feature-based reasoning

---

## 📁 Project Structure


---

## 🔁 Typical Workflow

1. Prepare dataset  
2. Train Logistic Regression model  
3. Evaluate performance & sanity  
4. Use inference functions in backend/API  
5. Display risk + reasons in frontend  

---

## 🔍 Explainability (Important)

Every prediction can be explained using:
- Feature coefficients
- Input feature values

Example output:
> **High Risk**  
> Reasons: Night riding, high intersections, rider fatigue

This transparency is intentional and critical.

---

## ⚠️ What This Module Does NOT Do

- ❌ Accident prediction
- ❌ Medical diagnosis
- ❌ Legal risk assessment
- ❌ Real-time traffic optimization

It is a **preventive safety indicator**, not a decision-maker.

---

## 🏁 Hackathon Readiness

- No paid APIs
- No fragile dependencies
- No black-box ML
- Clear ethical boundaries
- Easy to demo & explain

This module is designed to be **robust, defensible, and practical** under hackathon constraints.

---

## 📌 One-line Summary (Pitch-Ready)

> “A one-tap, explainable system that warns gig workers about risky routes before they ride — using lightweight ML and real-world safety proxies.”
