# Route Risk Dataset

This folder contains the datasets used for the **Route Risk Classification** module of the Gig Worker Safety Platform.

The goal of this dataset is **not accident prediction**, but **relative route risk estimation** for delivery riders under real-world constraints.

---

## 🧾 Dataset Description

### 1. Base Dataset (`raw/route_risk_synthetic_base.csv`)

- ~300 rows
- Hand-crafted synthetic data
- Used as a **reference distribution**
- Expanded later to generate a stable training dataset

### 2. Expanded Dataset (`processed/route_risk_expanded_10k.csv`)

- ~10,000 rows
- Generated using controlled noise and resampling
- Labels recomputed using the same risk logic
- Used for **model training and evaluation**

---

## 📊 Feature Definitions

| Feature              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| route_distance_km    | Total route distance in kilometers                           |
| route_duration_min   | Estimated route duration in minutes                          |
| intersection_density | Number of intersections per km (risk proxy)                  |
| is_night             | 1 if night-time, else 0                                      |
| weather_stress_index | Environmental stress (0 = normal, 0.5 = moderate, 1 = harsh) |
| fatigue_score        | Rider self-fatigue score (1–5)                               |
| shift_duration_hours | Hours worked in the current shift                            |
| route_risk_label     | Target label: Low / Medium / High                            |

---

## 🏷️ Labeling Philosophy

Risk labels are **proxy-based and explainable**, derived from:

- Route exposure
- Environmental stress
- Rider fatigue

This dataset **does not claim** to predict accidents or medical outcomes.

---

## ⚠️ Ethical & Practical Notes

- No real accident data is used
- No personal data is collected
- No real-time traffic dependency
- Designed for **hackathon-safe, explainable ML**

---

## ✅ Intended Usage

- Train lightweight ML models (Logistic Regression)
- Extract feature importance for explainability
- Power one-tap risk warnings in the frontend
