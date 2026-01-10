import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv
from datetime import datetime
import json
import time as t

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-flash-latest")
else:
    model = None

# --- NEW: Safety Settings to prevent blocking Accident/Crime descriptions ---
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

def create_fallback_data(transcription, category, location, time, error_msg):
    """
    Returns a valid JSON structure even if the AI fails.
    """
    return {
        "meta": { 
             "report_id": f"ERR_{int(t.time())}", 
             "report_type": "Error Log" 
        },
        "title": "Processing Failed",
        "summary": f"Report generation failed: {error_msg[:50]}...",
        "severity": "low",
        "category": category,
        "time": time,
        "narrative": {
            "objective_summary": f"Could not generate report due to AI error: {error_msg}. Original Transcript: {transcription[:100]}...",
            "chronological_timeline": []
        },
        "entities": {
            "vehicles": [],
            "people": []
        },
        "location_context": {
            "transcript_mentioned_location": "N/A",
            "system_recorded_gps": str(location)
        }
    }

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
        # Pass safety_settings to avoid "Finish Reason: Safety"
        response = model.generate_content(prompt, safety_settings=safety_settings)
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)

        # --- CRITICAL GPS FIX ---
        if "location_context" not in data:
            data["location_context"] = {}
        
        data["location_context"]["system_recorded_gps"] = str(location) 
        # ------------------------

        return data

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return create_fallback_data(transcription, category, location, time, str(e))

if __name__ == "__main__":
    fake_transcription = "I was riding near the Alliance Colony highway and a red car hit me. My leg is hurt."
    fake_category = "Accident"
    fake_loc = "Rudrapur, Highway 9"
    fake_time = "2025-10-12 21:00:00"

    result = generate_incident_json(fake_transcription, fake_category, fake_loc, fake_time)
    
    if result:
        print("\n✅ JSON Generated Successfully:")
        print(json.dumps(result, indent=2))