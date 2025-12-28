# Overview
>This document outlines the data sources, synthetic generation logic, and feature engineering used to power the Risk Scoring Model.

>**Important:**
This dataset does not represent any true conditions for any region in India.It is intended only to model relative risk of location to riders for research and hackathon demonstration purposes

## Data Philosophy
>As per the project vision, we prioritize Transparency > Perfect Accuracy. Because real-time accident data for gig workers is often siloed within platforms like Swiggy or Zomato , we utilize a Simulated/Synthetic Data Strategy. This allows us to build a functional MVP that demonstrates "Responsible AI" without legal or privacy risks.


## 📊 The Data (Training Data)

### We Use: **Synthetic (Artificial) Data**

**Why synthetic?**
- Real accident data is hard to get
- Kaggle datasets are incomplete
- Synthetic data is realistic enough for demo/hackathon

### What Our Data Looks Like:

**10,000 samples** with these patterns:

| Feature | Distribution | Example Values |
|---------|-------------|----------------|
| 🕐 **Hour** | 24 hours | 0, 8, 14, 18, 23 |
| 📅 **Day** | 7 days, more weekday accidents | Monday, Friday, Saturday |
| 🌤️ **Weather** | 65% fine, 20% cloudy, 12% rainy, 3% foggy | Fine, Rainy, Foggy |
| 🛣️ **Road Type** | 40% single lane, 30% dual lane | Single carriageway, Roundabout |
| 🚗 **Speed Limit** | 30-80 kmph | 30, 40, 50, 60, 80 |

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
