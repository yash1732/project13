import os
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime
import json


load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

model= genai.GenerativeModel("gemini-flash-latest")

def generate_incident_json(transcription, category, location, time):
    """
    Sends all data to Gemini to write the final report.
    """

    prompt = f"""
        You are the "GigGuard" Incident Documentation AI.
        Your sole purpose is to create a neutral, structured archive of an incident based on user testimony.

    --- SYSTEM INPUTS ---
    SYSTEM_TIME: {time}
    GPS_COORDS: {location}
    USER_SELECTED_CATEGORY: {category}
    ---------------------

    --- USER AUDIO TRANSCRIPT ---
    <transcript>
    "{transcription}"
    </transcript>
    -----------------------------

    --- ANALYST INSTRUCTIONS ---
    1. **Neutrality Protocol**: You are a Scribe, not a Judge. Always use attribution verbs like "User states," "User claims," or "User reports." Do not present user claims as objective facts.
    2. **Entity Extraction**: Identify specific details (Vehicles, Injuries, Weapons, Items) strictly from the text.
    3. **Timeline Construction**: Reconstruct the sequence of events chronologically based on the user's narration.
    4. **Severity Tagging**:
        - "Low": Property damage only / Non-urgent dispute.
        - "Medium": Verbal aggression / Minor injury.
        - "High": Physical threat / Significant injury.
        - "Critical": Life-threatening situation.

    5. **Output Constraint**: Return ONLY raw JSON. Do not include markdown formatting (like ```json).

    --- REQUIRED JSON STRUCTURE ---
    {{
    "meta": {{
        "report_type": "GigGuard Incident Archive",
        "generated_at": "{time}" 
    }},
    "classification": {{
        "primary_category": "Select best fit (e.g., Traffic Accident, Harassment)",
        "severity_level": "Low/Medium/High/Critical",
        "keywords": ["List", "of", "relevant", "tags"]
    }},
    "narrative": {{
        "objective_summary": "A 3-sentence summary using neutral language (e.g., 'User reports...').",
        "chronological_timeline": [
        {{ "time_reference": "e.g., '10 mins ago' or 'At the start'", "event": "Event description" }}
        ]
    }},
    "entities": {{
        "people_involved": ["Driver", "Passenger", "Police", etc. (or empty)],
        "vehicles": ["Silver Sedan", "Bike" (or empty)],
        "injuries_or_damages": ["Scraped knee", "Broken headlight" (or empty)]
    }},
    "location_context": {{
        "system_recorded_gps": "{location}",
        "transcript_mentioned_location": "Extract specific location text from audio or null"
    }}
    }}
    """

    print("🧠 AI is extracting structured data...")
    response = model.generate_content(prompt)


    # Clean up response just in case (remove backticks if Gemini adds them)
    clean_json = response.text.strip().replace("```json", "").replace("```", "")
    
    try:
        # Verify it's valid JSON by parsing it
        data = json.loads(clean_json)
        return data
    except json.JSONDecodeError:
        print("❌ Error: AI did not return valid JSON.")
        return None
    


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