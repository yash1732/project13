import pandas as pd
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

print("📊 Loading data...")
data = pd.read_csv("backend\\ml\\incident_ai\\data\\sample_dataset.csv")

X=data['text']
y=data['category']

model=make_pipeline(CountVectorizer(),MultinomialNB())

print("🧠 Training the brain...")
model.fit(X, y)

# sample testing
test_text = "He hit my bike and shouted at me"
prediction = model.predict([test_text])[0]
print(f"🧪 Test Prediction: '{test_text}' -> {prediction}")

# saving the model

with open("incident_model.pkl", "wb") as f:
    pickle.dump(model, f)
    print("✅ Model saved as 'incident_model.pkl'")