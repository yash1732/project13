"""
Train Logistic Regression model for Route Risk Classification.
Model is lightweight, explainable, and hackathon-safe.
"""

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from features.feature_extraction import prepare_features, split_features_and_label
import os

root = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(root,'data','route_risk_expanded_10k.csv')
MODEL_PATH = os.path.join(root,'artifacts','route_risk_logreg.joblib')
RANDOM_STATE = 42


def train():
    # Load data
    df = pd.read_csv(DATA_PATH)

    # Prepare features
    df_prepared = prepare_features(df, normalize=True)
    X, y = split_features_and_label(df_prepared)

    # Train / validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y
    )

    # Model
    model = LogisticRegression(
        multi_class="multinomial",
        max_iter=1000,
        class_weight="balanced",
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # Save model
    # joblib.dump(model, MODEL_PATH)

    print("Model trained and saved to:", MODEL_PATH)
    print("Validation accuracy:", model.score(X_val, y_val))


if __name__ == "__main__":
    train()
    
