# Gig Worker Safety & Support Platform

A safety-first web platform designed to help delivery gig workers **anticipate risks, respond during emergencies, and protect themselves after incidents**  using explainable AI and practical system design.

Built as a hackathon MVP for TechSprint 2026, by Team Fauxfly.

---

### Intial UI Plan
<img width="1768" height="608" alt="ui_plan" src="https://github.com/user-attachments/assets/db743159-5691-4f00-b53a-a560e703c97e" />

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
- **Backend**: API orchestration and authentication (firebase)
- **ML Services**: Explainable risk & fatigue indicators
- **AI Services**: Incident report generation (Gemini)
- **External Services**: Maps, geolocation, nearby emergency support

Detailed system flow is documented in `docs/system_flow.md`.

---

## ML Part

All ML components are implemented as part of a unified, explainable backend and exposed via REST APIs.

### 1) Fatigue & Workload Risk Analysis

**Inputs**
- Shift duration
- Consecutive work days
- Night work fraction
- Weather stress
- Self-reported tiredness

**Model & Output**
- Multinomial Logistic Regression (interpretable)
- Outputs: `Low / Medium / High` risk, probabilities, and a risk score
- Trained on clearly disclosed **synthetic workload scenarios**

---

### 2) Route / Area Risk Analysis
Provides **pre-ride safety insights** by estimating relative risk levels for selected routes or areas.

- Uses contextual features such as time of day, route characteristics, and area signals
- Outputs a simple **risk level (Low / Medium / High)** for easy decision-making
- Designed for **prevention**, not navigation or enforcement

---

### 3) Incident Analysis & Report Generation
Supports **post-incident protection** through structured incident documentation.

- Takes basic incident details (type, description, time, location)
- Generates a **clean, structured incident summary/report**
- Intended for documentation and future reference, not legal judgment


---

## ML APIs

All machine learning functionalities are exposed through a **single FastAPI-based REST service**, designed for easy frontend integration.

The API handles:
- **Workload / fatigue risk prediction**
- **Route or area risk scoring**
- **Related ML-based safety insights**

### API Overview
- **Framework**: FastAPI (REST API)
- **Input**: JSON-based feature data from frontend
- **Output**: Risk level, confidence/probabilities, and computed risk score

### POST endpoints
-


Refer `backend/api/api_readme.md`

---


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
