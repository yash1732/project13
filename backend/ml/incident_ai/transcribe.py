import os
import google.generativeai as genai
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env file")
    exit()

genai.configure(api_key=api_key)

def process_incident_audio(audio_path):
    """
    Sends audio to Gemini 1.5 Flash to get BOTH transcription and classification.
    """
    print(f'🚀 Uploading {audio_path} to Gemini...')

    myfile = genai.upload_file(audio_path)
    print(f'✅ Upload complete: {myfile.name}')

    model = genai.GenerativeModel('gemini-flash-latest')

    # Updated Prompt with your specific categories
    prompt = """
    You are an incident reporting assistant. Listen to this audio recording of a user describing an incident.
    The audio may be in English or Indian regional languages.
    
    Perform two tasks:
    1. TRANSCRIPTION: Transcribe the audio into clear, fluent English. If the audio is in a different language, translate it accurately to English.
    
    2. CLASSIFICATION: Based on the transcribed details, classify the incident into exactly one of these categories:
       - "Accident" (Vehicle collisions, falls, physical injuries, fire accidents)
       - "Medical" (Heart attacks, fainting, sudden illness not caused by external force/accident)
       - "Theft" (Robbery, burglary, pickpocketing, stolen items)
       - "Harassment" (Stalking, verbal abuse, physical threats, bullying)
       - "Other" (Any other situation, irrelevant audio, or unclear context)

    Output a JSON object with this exact schema:
    {
        "transcription": "The full English text of what the user said...",
        "category": "Accident" or "Medical" or "Theft" or "Harassment" or "Other"
    }
    """
    
    print('🤖 Processing audio (Transcribing + Classifying)...')
    
    result = model.generate_content(
        [myfile, prompt],
        generation_config={"response_mime_type": "application/json"}
    )

    # Parse JSON result
    try:
        data = json.loads(result.text)
        return data
    except json.JSONDecodeError:
        # Fallback in case something goes wrong with the JSON generation
        print("Error parsing JSON response.")
        return {"transcription": result.text, "category": "Other"}

# Test Block
if __name__ == '__main__':
    test_file = os.path.join('backend', 'ml', 'incident_ai', 'test_audio2.m4a')

    if os.path.exists(test_file):
        print("\n--- RESULT ---")
        result_data = process_incident_audio(test_file)
        
        print(f"📂 Category: {result_data['category']}")
        print(f"📝 Text: {result_data['transcription']}")
        print("--------------")
    else:
        print(f"❌ Error: Could not find '{test_file}'.")