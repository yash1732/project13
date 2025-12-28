"""Training script for risk model"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def create_training_data(n_samples=10000):
    """Generate realistic synthetic accident data"""
    np.random.seed(42)
    print(f"📊 Creating {n_samples} training samples...")
    
    hours = np.random.randint(0, 24, n_samples)
    days = np.random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 
                             'Friday', 'Saturday', 'Sunday'], n_samples)
    weather = np.random.choice(['Fine', 'Cloudy', 'Rainy', 'Foggy'], 
                               n_samples, p=[0.65, 0.20, 0.12, 0.03])
    road_types = np.random.choice(['Single carriageway', 'Dual carriageway', 
                                   'One way street', 'Roundabout'], n_samples)
    speed_limits = np.random.choice([30, 40, 50, 60, 80], n_samples)
    
    df = pd.DataFrame({
        'hour': hours,
        'day_of_week': days,
        'weather': weather,
        'road_type': road_types,
        'speed_limit': speed_limits
    })
    return df

def engineer_features(df):
    """Create risk features"""
    df['is_rush_hour'] = df['hour'].isin([8, 9, 10, 17, 18, 19, 20]).astype(int)
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 5)).astype(int)
    df['is_weekend'] = df['day_of_week'].isin(['Saturday', 'Sunday']).astype(int)
    
    weather_map = {'Fine': 0, 'Cloudy': 1, 'Rainy': 2, 'Foggy': 2}
    df['weather_risk'] = df['weather'].map(weather_map)
    
    road_map = {'Dual carriageway': 1, 'One way street': 1, 
                'Single carriageway': 2, 'Roundabout': 2}
    df['road_risk'] = df['road_type'].map(road_map)
    
    df['speed_risk'] = (df['speed_limit'] > 40).astype(int) + (df['speed_limit'] > 60).astype(int)
    return df

def create_risk_labels(df):
    """Create Low/Medium/High risk labels"""
    risk_score = (df['weather_risk'] + df['road_risk'] + df['is_night'] * 2 +
                  df['is_rush_hour'] + df['speed_risk'])
    df['risk_level'] = pd.cut(risk_score, bins=[-1, 3, 5, 20], labels=['Low', 'Medium', 'High'])
    return df

def train_model():
    """Main training function"""
    print("🤖 Training Risk Scoring Model")
    print("=" * 60)
    
    df = create_training_data(10000)
    df = engineer_features(df)
    df = create_risk_labels(df)
    
    feature_cols = ['hour', 'is_rush_hour', 'is_night', 'is_weekend',
                    'weather_risk', 'road_risk', 'speed_risk']
    X = df[feature_cols]
    y = df['risk_level'].astype(str)
    
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    
    print(f"\n✅ Training Accuracy: {train_acc:.3f}")
    print(f"✅ Testing Accuracy: {test_acc:.3f}")
    
    print("\n📊 Feature Importance:")
    for feature, importance in zip(feature_cols, model.feature_importances_):
        print(f"  {feature:20s}: {importance:.4f}")
    
    os.makedirs('artifacts', exist_ok=True)
    joblib.dump(model, 'artifacts/risk_model.pkl')
    joblib.dump(label_encoder, 'artifacts/label_encoder.pkl')
    
    print("\n💾 Model saved to artifacts/")
    return model, label_encoder

if __name__ == "__main__":
    train_model()

print("✅ Created train_model.py")
