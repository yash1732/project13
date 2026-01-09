# System Flow & Architecture

## Project Name
Gig Worker Safety & Support Platform

## Purpose of This Document
This document explains how the system works end-to-end, describing:
- how users interact with the platform
- how data flows through the system
- how ML and AI components are integrated
- what decisions are automated vs assisted
- how safety, privacy, and responsibility are maintained

This document focuses on **system clarity**, not implementation details.

---

## 1. Design Philosophy

The platform is built around a simple but powerful idea:

> **Prevent harm when possible, respond fast during emergencies, and protect workers after incidents.**

Key principles:
- Practical over complex
- Explainable ML over black-box models
- Assistance, not automated decision-making
- Privacy-first by design
- Hackathon-feasible but real-world inspired

---

## 2. High-Level Architecture Overview

The system is organized into **modular services**, each with a clear responsibility.

### Core Components
1. Frontend (Web Application)
2. Backend (API & Orchestration)
3. ML Services (Risk & Fatigue Scoring)
4. AI Service (Incident Report Generation)
5. External Services (Maps, Location, Emergency Data)

Each component can evolve independently.

---

## 3. Component Responsibilities

### 3.1 Frontend (Web App)

**Primary role:** User interaction and visualization.

Responsibilities:
- Collect user inputs (workload, tiredness, incident details)
- Display risk scores and warnings
- Provide SOS and emergency UI
- Show maps, nearby support, and reports
- Ensure mobile-first usability

The frontend does **not** perform any ML logic.

---

### 3.2 Backend (API Layer)

**Primary role:** Coordination and validation.

Responsibilities:
- Validate incoming requests
- Route data to ML / AI services
- Handle failures gracefully
- Store incident logs and reports
- Enforce privacy and access control

The backend acts as the system’s “traffic controller”.

---

### 3.3 ML Service — Workload & Fatigue Risk (Member 3)

**Primary role:** Estimate human workload risk.

Inputs:
- Shift duration
- Consecutive work days
- Night work fraction
- Weather stress index
- Self-reported tiredness

Processing:
- Min–max scaling
- Multinomial logistic regression
- Explainable probability output

Outputs:
- Risk class (Low / Medium / High)
- Risk probabilities
- Risk score = P(High)

Important constraints:
- No personal health data stored
- No medical or legal claims
- Used for preventive insight only

---

### 3.4 ML Service — Route / Area Risk (Member 1)

**Primary role:** Estimate environmental risk.

Inputs (examples):
- Time of day
- Area type (highway, residential, market)
- Traffic density proxy
- Weather conditions
- Accident-prone zone indicators

Outputs:
- Area / route risk class
- Simple safety score
- Human-readable risk reasons

This model focuses on **external danger**, not worker wellbeing.

---

### 3.5 AI Service — Incident Report Generation (Member 2)

**Primary role:** Post-incident protection.

Inputs:
- Incident type
- User description
- Time and location

Processing:
- Text summarization
- Structured formatting
- Timeline generation

Outputs:
- Clear incident report
- Downloadable / shareable format

Important rule:
- AI does NOT make legal or medical judgments
- AI only structures user-provided information

---

## 4. End-to-End User Flows (some flows below)

### 4.1 Flow A — Pre-Shift Risk Awareness (Prevention)

1. Worker opens the web app
2. Auto fetches workload details
3. Frontend sends data to backend
4. Backend calls workload ML service
5. ML service returns risk estimate
6. Frontend displays:
   - risk badge (Low / Medium / High)
   - short warning message
   - optional probability breakdown

Purpose:
- Increase awareness before starting a shift
- Encourage safer decisions (breaks, shorter shifts)

---

### 4.2 Flow B — Emergency SOS (Response)

1. Worker presses SOS button
2. Frontend fetches current GPS location
3. Backend queries external services
4. Nearest support is displayed:
   - hospitals
   - police stations
   - emergency contacts
5. Worker gets immediate guidance

Important design choice:
- No ML involved
- Reliability > intelligence

---

### 4.3 Flow C — Incident Logging & Recovery (Protection)

1. Worker fills incident form
2. Backend stores raw incident data
3. AI service generates structured report
4. Worker can:
   - view the report
   - download/share it
   - keep it for future reference

Purpose:
- Documentation
- Self-protection
- Reduced friction after incidents

---

## 5. Data Flow Summary

[User Input] --> [Frontend Validation] --> [Backend API] --> [ML / AI Services] --> [Structured Output] --> [User Interface]


There are no hidden loops or opaque processes.

---

## 6. Data Storage & Privacy

### What IS Stored
- User-submitted incident logs
- Generated incident reports (optional)

### What is NOT Stored
- Raw ML input features
- Continuous location tracking
- Personal health records

Privacy is preserved by design.

---

## 7. Failure Handling Strategy

The system is designed to fail safely.

Examples:
- Missing input → frontend blocks submission
- ML service unavailable → risk shown as “unavailable”
- AI service failure → raw incident still saved

This ensures no single failure breaks the entire flow.

---

## 8. Responsible AI & Ethics

Key ethical commitments:
- Synthetic data is clearly disclosed
- Models are explainable
- No automated decisions affecting employment, health, or legal outcomes
- ML outputs are advisory, not authoritative

Transparency is prioritized over performance claims.

---

## 9. How Components Work Together

Environmental Risk (Member 1)  
+  
Human Workload Risk (Member 3)  
↓  
Holistic Safety Awareness

This combination allows the platform to:
- Warn about dangerous routes
- Warn about dangerous workloads
- Support workers before, during, and after incidents

---

## 10. One-Line System Summary (Pitch-Ready)

> “The platform follows a prevent–respond–recover workflow, combining explainable ML insights with reliable emergency and reporting tools to improve gig worker safety.”

---

## 11. Future Extensions (Non-MVP)

- Insurance claim integration
- Employer dashboards
- City-level safety heatmaps
- Expansion to other gig professions

These are intentionally out of scope for the MVP.

---

## End of Document

