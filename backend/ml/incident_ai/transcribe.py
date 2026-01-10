import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("⚠️ Warning: GOOGLE_API_KEY not found. AI features will fail, but Server is ON.")
else:
    genai.configure(api_key=api_key)

# --- SAFETY SETTINGS ---
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

def process_incident_audio(audio_path):
    if not api_key:
        return {
            "transcription": "System Error: No Google API Key configured.",
            "category": "Other",
            "title": "Configuration Error",
            "severity": "low",
            "summary": "Please set up your API key."
        }
        
    print(f'🚀 Uploading {audio_path} to Gemini...')

    try:
        myfile = genai.upload_file(audio_path)
        print(f'✅ Upload complete: {myfile.name}')
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return {
            "transcription": "Error uploading file.",
            "category": "Other",
            "title": "Upload Error",
            "severity": "low",
            "summary": "File upload failed."
        }

    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = """
    You are an incident reporting assistant for 'GigGuard'. 
    Listen to this audio recording of a user describing an incident.
    The audio may be in English or Indian regional languages.
    
    Perform three tasks:
    1. TRANSCRIPTION: Transcribe the audio into clear, fluent English. If in a different language, translate accurately.
    
    2. CLASSIFICATION: Classify the incident into exactly one of these categories:
       - "Accident" (Vehicle collisions, falls, physical injuries, fire)
       - "Medical" (Heart attacks, fainting, sudden illness)
       - "Theft" (Robbery, burglary, pickpocketing)
       - "Harassment" (Stalking, verbal abuse, threats)
       - "Other" (Unclear context or irrelevant)

    3. METADATA GENERATION: 
       - Title: A short 3-5 word title for a dashboard card (e.g., 'Minor Bike Collision').
       - Severity: 'low', 'medium', or 'high' based on urgency and impact.
       - Summary: A single short sentence (max 12 words) for the subtitle.

    Output a valid JSON object with this EXACT schema:
    {
        "transcription": "The full English text...",
        "category": "Accident" or "Medical" or "Theft" or "Harassment" or "Other",
        "title": "Short Title Here",
        "severity": "low" or "medium" or "high",
        "summary": "Short summary here."
    }
    """
    
    print('🤖 Processing audio (Transcribing + Metadata)...')
    
    try:
        # Added safety_settings here
        result = model.generate_content(
            [myfile, prompt],
            generation_config={"response_mime_type": "application/json"},
            safety_settings=safety_settings
        )

        data = json.loads(result.text)
        return data

    except json.JSONDecodeError:
        print("❌ Error: AI returned invalid JSON.")
        return {
            "transcription": result.text if result else "No text generated",
            "category": "Other", 
            "title": "Processing Error",
            "severity": "medium",
            "summary": "AI output format error."
        }
    except Exception as e:
        print(f"❌ GenAI Error: {e}")
        return {
            "transcription": "System error during analysis (Check Safety/API).",
            "category": "Other",
            "title": "System Error",
            "severity": "low",
            "summary": "An internal error occurred."
        }

if __name__ == '__main__':
    test_file = os.path.join('backend', 'ml', 'incident_ai', 'test_audio.m4a')
    if os.path.exists(test_file):
        print("\n--- RESULT ---")
        result_data = process_incident_audio(test_file)
        print(f"📂 Category: {result_data.get('category')}")
        print(f"🏷️  Title:    {result_data.get('title')}")
        print(f"⚠️  Severity: {result_data.get('severity')}")
        print(f"📝 Text:      {result_data.get('transcription')[:60]}...")
        print("--------------")
    else:
        print(f"❌ Error: Could not find '{test_file}'.")