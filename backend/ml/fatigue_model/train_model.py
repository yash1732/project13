import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib
import os

root=os.path.dirname(__file__)
data_path=os.path.join(root,'data','base_data_expanded.csv')
df = pd.read_csv(data_path)

FEATURES = [
    "shift_duration_hours",
    "consecutive_work_days",
    "night_work_fraction",
    "weather_stress_index",
    "self_reported_tiredness"
]
TARGET = "workload_risk_label"

X = df[FEATURES]
y = df[TARGET]

label_map = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}
y_encoded = y.map(label_map)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(
    multi_class="multinomial",
    solver="lbfgs",
    penalty="l2",
    max_iter=1000
)
model.fit(X_train_scaled, y_train)


# coef_df = pd.DataFrame(
#     model.coef_,
#     columns=FEATURES,
#     index=["Low", "Medium", "High"]
# )
# print(coef_df)


joblib.dump(model, os.path.join(root,"artifacts/model.pkl"))
joblib.dump(scaler, os.path.join(root,"artifacts/scaler.pkl"))
joblib.dump(label_map, os.path.join(root,"artifacts/label_map.pkl"))

print("✅ Model artifacts saved successfully")




