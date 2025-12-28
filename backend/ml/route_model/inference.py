"""Inference module for risk prediction"""
import joblib
import pandas as pd
import os

root=os.path.dirname(__file__)

class RiskPredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.load_model()
    
    def load_model(self):
        """Load trained model"""
        if os.path.exists(os.path.join(root,'artifacts/route_model.pkl')):
            self.model = joblib.load(os.path.join(root,'artifacts/route_model.pkl'))
            self.label_encoder = joblib.load(os.path.join(root,'artifacts/label_encoder.pkl'))
            print("✅ Model loaded")
        else:
            print("⚠️  Model not found")
    
    def prepare_features(self, hour, day_of_week, weather, road_type, speed_limit):
        """Convert input to features"""
        is_rush_hour = 1 if hour in [8, 9, 10, 17, 18, 19, 20] else 0
        is_night = 1 if (hour >= 22 or hour <= 5) else 0
        is_weekend = 1 if day_of_week in ['Saturday', 'Sunday'] else 0
        
        weather_map = {'Fine': 0, 'Cloudy': 1, 'Rainy': 2, 'Foggy': 2}
        weather_risk = weather_map.get(weather, 1)
        
        road_map = {'Dual carriageway': 1, 'One way street': 1,
                    'Single carriageway': 2, 'Roundabout': 2}
        road_risk = road_map.get(road_type, 2)
        
        speed_risk = (1 if speed_limit > 40 else 0) + (1 if speed_limit > 60 else 0)
        
        return pd.DataFrame([{
            'hour': hour, 'is_rush_hour': is_rush_hour, 'is_night': is_night,
            'is_weekend': is_weekend, 'weather_risk': weather_risk,
            'road_risk': road_risk, 'speed_risk': speed_risk
        }])
    
    def generate_explanation(self, hour, weather, road_type, speed_limit):
        """Generate explanation"""
        reasons = []
        if hour >= 22 or hour <= 5:
            reasons.append("Night time (reduced visibility)")
        elif hour in [8, 9, 10, 17, 18, 19, 20]:
            reasons.append("Rush hour (high traffic)")
        if weather in ['Rainy', 'Foggy']:
            reasons.append(f"{weather} weather conditions")
        if road_type in ['Single carriageway', 'Roundabout']:
            reasons.append(f"{road_type} (complex navigation)")
        if speed_limit > 60:
            reasons.append(f"High speed zone ({speed_limit} kmph)")
        
        return "Risk factors: " + ", ".join(reasons) if reasons else "Normal conditions"
    
    def predict(self, hour, day_of_week, weather, road_type, speed_limit=50):
        """Make prediction"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        features = self.prepare_features(hour, day_of_week, weather, road_type, speed_limit)
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        risk_level = self.label_encoder.inverse_transform([prediction])[0]
        confidence = float(probabilities[prediction])
        explanation = self.generate_explanation(hour, weather, road_type, speed_limit)
        
        return {
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "explanation": explanation
        }

predictor = RiskPredictor()

def get_risk_prediction(hour, day_of_week, weather, road_type, speed_limit=50):
    """Helper function"""
    return predictor.predict(hour, day_of_week, weather, road_type, speed_limit)

