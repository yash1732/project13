import os
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime
import json

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

# --- FIX: Only configure if key exists ---
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-flash-latest")
else:
    model = None  # Placeholder

def generate_incident_json(transcription, category, location, time):
    if not model:
        return create_fallback_data(transcription, category, location, time, "AI Model Not Configured")

    prompt = f"""
    Analyze this audio transcript and return a JSON object.
    
    CONTEXT:
    - Incident Type: {category}
    - Audio Transcript: "{transcription}"
    
    OUTPUT FORMAT (JSON ONLY):
    {{
      "meta": {{ "report_id": "INC_123", "report_type": "Automated Field Report" }},
      "title": "Short Title",
      "summary": "One sentence summary",
      "severity": "Medium",
      "category": "{category}",
      "time": "{time}",
      "narrative": {{
        "objective_summary": "Full paragraph description...",
        "chronological_timeline": ["Event 1", "Event 2"]
      }},
      "entities": {{
        "vehicles": [],
        "people": []
      }},
      "location_context": {{
        "transcript_mentioned_location": "Extract location from text or N/A"
      }}
    }}
    """

    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)

        # --- CRITICAL GPS FIX ---
        # We FORCE the real GPS data here. We do not trust the AI to echo it back.
        if "location_context" not in data:
            data["location_context"] = {}
        
        # Overwrite with the actual string passed from Frontend
        data["location_context"]["system_recorded_gps"] = str(location) 
        # ------------------------

        return data

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return create_fallback_data(transcription, category, location, time, str(e))


# --- TEST BLOCK ---
if __name__ == "__main__":
    fake_transcription = "I was riding near the Alliance Colony highway and a red car hit me. My leg is hurt."
    fake_category = "Accident"
    fake_loc = "Rudrapur, Highway 9"
    fake_time = "2025-10-12 21:00:00"

    result = generate_incident_json(fake_transcription, fake_category, fake_loc, fake_time)
    
    if result:
        print("\n✅ JSON Generated Successfully:")
        print(json.dumps(result, indent=2))