import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Define paths for cleaner management
DATA_PATH = r"backend\ml\incident_ai\data\sample_dataset.csv"
MODEL_PATH = "A:\\Projects\\project13\\backend\\ml\\incident_ai\\incident_model.pkl"

def train_model(data_path=DATA_PATH, save_path=MODEL_PATH):
    """
    Loads data, trains the Naive Bayes pipeline, and saves the model to disk.
    """
    print(f"📊 Loading data from {data_path}...")
    
    if not os.path.exists(data_path):
        print(f"❌ Error: Data file not found at {data_path}")
        return None

    data = pd.read_csv(data_path)
    X = data['text']
    y = data['category']

    # Create and train the pipeline
    print("🧠 Training the brain...")
    model = make_pipeline(CountVectorizer(), MultinomialNB())
    model.fit(X, y)

    # Save the model
    with open(save_path, "wb") as f:
        pickle.dump(model, f)
    
    print(f"✅ Model trained and saved as '{save_path}'")
    return model

def predict_category(text, model_path=MODEL_PATH):
    """
    Loads the saved model and returns the predicted category for the input text.
    """
    # Check if model exists
    if not os.path.exists(model_path):
        return "Error: Model file not found. Train the model first."

    # Load the model
    with open(model_path, "rb") as f:
        loaded_model = pickle.load(f)

    # Predict (wrap text in a list because sklearn expects an iterable)
    prediction = loaded_model.predict([text])[0]
    return prediction

# --- TEST RUN ---
if __name__ == "__main__":
    # 1. Run the training function
    # Note: Ensure your CSV file exists at DATA_PATH before running this!
    train_model()

    # 2. Test the prediction function
    test_text = "He hit my bike and shouted at me"
    result = predict_category(test_text)
    
    print("-" * 30)
    print(f"🧪 Test Input: '{test_text}'")
    print(f"🏷️  Prediction: {result}")
    print("-" * 30)