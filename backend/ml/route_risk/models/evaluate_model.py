"""
Evaluation utilities for the Route Risk model.
Produces metrics useful for judges and debugging.
"""

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

from features.feature_extraction import prepare_features, split_features_and_label
import os

root = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(root,'data','route_risk_expanded_10k.csv')
MODEL_PATH = os.path.join(root,'artifacts','route_risk_logreg.joblib')


def evaluate():
    # Load data & model
    df = pd.read_csv(DATA_PATH)
    model = joblib.load(MODEL_PATH)

    # Prepare features
    df_prepared = prepare_features(df, normalize=True)
    X, y = split_features_and_label(df_prepared)

    # Predictions
    y_pred = model.predict(X)

    # Metrics
    print("\nClassification Report:\n")
    print(classification_report(y, y_pred))

    print("\nConfusion Matrix:\n")
    print(confusion_matrix(y, y_pred))


if __name__ == "__main__":
    evaluate()
