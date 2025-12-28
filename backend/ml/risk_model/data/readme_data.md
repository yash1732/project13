# Overview
>This document outlines the data sources, synthetic generation logic, and feature engineering used to power the Risk Scoring Model.

>**Important:**
This dataset does not represent any true conditions for any region in India.It is intended only to model relative risk of location to riders for research and hackathon demonstration purposes

## Data Philosophy
>As per the project vision, we prioritize Transparency > Perfect Accuracy. Because real-time accident data for gig workers is often siloed within platforms like Swiggy or Zomato , we utilize a Simulated/Synthetic Data Strategy. This allows us to build a functional MVP that demonstrates "Responsible AI" without legal or privacy risks.


## Features

| Column Name | Description|
| ------------- |:-------------:|
| Hour of Day      | Integer (0-23)	, High risk during night shifts (22:00 - 05:00).     |
| Road Type      | Categorical , Highways are weighted higher than residential streets    |
| Weather      | Categorical	, Rain or extreme heat adds a risk multiplier     |
|Speed Limit|Integer	, Higher speeds correlate with higher incident severity|

## Risk Label Classification (Target)

The model classifies every route into one of three distinct categories:


🟢 Low Risk: High visibility, low traffic, and safe road types.

🟡 Medium Risk: Moderate traffic or dawn/dusk hours.

🔴 High Risk: Combined factors such as "Night + Rain + Highway"



## Intended Use

>1. Training explainable ML models for route risk scoring\
2. Demonstration of responsible AI in safety-focused systems\
3. Hackathon and research prototyping

## Limitations
No real-world ground truth\
Results should be interpreted qualitatively\
No PII (Personally Identifiable Information) is processed or stored in the risk engine
