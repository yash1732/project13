# Gig Worker Safety & Support Platform

A safety-first web platform designed to help delivery gig workers **anticipate risks, respond during emergencies, and protect themselves after incidents** — using explainable AI and practical system design.

This project is built as a **hackathon MVP**, prioritizing clarity, responsibility, and real-world feasibility over unnecessary complexity.

---

##  Problem Context

Delivery gig workers (food, grocery, courier) face daily risks such as:
- unsafe traffic routes and accident-prone areas
- long working hours and fatigue
- weather exposure and night shifts
- lack of structured emergency support
- difficulty documenting incidents for future use

Currently, there is **no unified system** that supports workers **before**, **during**, and **after** risky situations.

---

##  Project Vision

The platform follows a **prevent → respond → recover** safety workflow:

- **Prevent**: Risk awareness before starting a shift  
- **Respond**: Fast emergency support during incidents  
- **Recover**: Structured incident documentation after incidents  

The system is designed to **assist workers**, not monitor or control them.

---

##  High-Level Architecture

- **Frontend**: Web-based, mobile-first UI (maps, forms, SOS)
- **Backend**: API orchestration and data handling
- **ML Services**: Explainable risk & fatigue indicators
- **AI Services**: Incident report generation (non-decisional)
- **External Services**: Maps, geolocation, nearby emergency support

Detailed system flow is documented in `docs/system_flow.md`.

---

##  ML Services (Explainable & Responsible)

### 1) Fatigue & Workload Risk Model

This repository includes a complete, explainable ML service that estimates **relative workload risk** for gig workers.

**Inputs**
- Shift duration
- Consecutive work days
- Night work fraction
- Weather stress index
- Self-reported tiredness

**Model**
- Multinomial Logistic Regression
- Min–max feature scaling
- L2 regularization
- Fully interpretable coefficients

**Outputs**
- Risk class: `Low / Medium / High`
- Risk probabilities
- Risk score = probability of `High` risk

The model is trained on **synthetic workload scenarios**, clearly disclosed, and is intended for **preventive insight**, not diagnosis.

### 2) Route / Area Risk Analysis
### 3) Incident Analysis & Report Generation

---

##  ML APIs

1) The workload risk model is exposed via a lightweight REST API for frontend integration.

- **Endpoint**: `POST /predict`
- **Input**: JSON workload features
- **Output**: Risk class, probabilities, and risk score

See:
`backend/api/fatigue_api.py`
`backend/api/api_readme.md`

2.
3.


---

##  Repository Structure

- backend/ → API layer (ML exposed to frontend)
- ml/ → Model training, inference, evaluation
- docs/ → System flow, ethics, impact
- frontend/ → Web UI (integration layer)


Supporting documentation:
- `docs/system_flow.md`
- `docs/impact_and_ethics.md`

---

##  Responsible AI & Ethics

- Models are explainable and transparent
- Synthetic / proxy data usage is disclosed
- No medical, legal, or employment decisions are made
- ML outputs are advisory, not authoritative
- No continuous tracking or personal health data stored

> **Ethical Disclosure:**  
> This platform uses explainable AI models trained on synthetic and proxy data to provide preventive safety insights. It is not intended for medical, legal, or employment decision-making.


---

##  Project Status

- Core ML services implemented and documented
- API contract defined and functional
- System flow and ethics clearly specified
- Ready for frontend integration and demo

---



> A safety-first platform that helps gig workers avoid danger, get help fast, and protect themselves after incidents — using explainable AI and real-world workflows.

---
