import os
import time

# --- IMPORT YOUR MODULES ---
# Ensure your transcribe.py has the NEW process_incident_audio function we just wrote
from transcribe import process_incident_audio
from generate_report import generate_incident_json
from docs_generator import create_word_report

# NOTE: 'from model import predict_category' is REMOVED because Gemini does it now.

def run_gigguard_pipeline(audio_path, system_gps, system_time):
    print("\n" + "="*50)
    print("🚀 STARTING GIGGUARD PIPELINE")
    print("="*50)

    # --- STEP 1: TRANSCRIPTION & CLASSIFICATION ---
    # Gemini now does both in one shot
    print(f"\n[1/5] 🎧 Processing Audio (Transcribing + Classifying): {audio_path}...")
    
    # This returns: {'transcription': "...", 'category': "..."}
    ai_result = process_incident_audio(audio_path)
    
    raw_transcript = ai_result['transcription']
    # We store the category now, but we will use it in Step 3
    initial_category = ai_result['category'] 

    # --- STEP 2: HUMAN VERIFICATION (The "Edit" Step) ---
    print("\n[2/5] ✍️  Verification Required")
    print("-" * 30)
    print(f"AI Heard: \"{raw_transcript}\"")
    print("-" * 30)
    
    # In a real app, this would be a text box on the Frontend.
    choice = input("Is this correct? (y/n): ").lower().strip()
    
    if choice == 'n':
        print("\n> Please type the corrected version below:")
        final_transcript = input("> ")
    else:
        final_transcript = raw_transcript
        
    print(f"\n✅ Transcript Locked: \"{final_transcript[:50]}...\"")

    # --- STEP 3: CATEGORY CONFIRMATION ---
    print("\n[3/5] 🧠 Category Detection...")
    # Since we already have the category from Step 1, we just assign it.
    # No extra API call or model loading needed here!
    category_label = initial_category
    
    print(f"   -> AI Classified audio as: {category_label}")

    # --- STEP 4: GENERATE STRUCTURED JSON ---
    print("\n[4/5] 📊 Generating Structured Report Data...")
    
    # We pass the validated text and the AI-detected category
    incident_data = generate_incident_json(
        transcription=final_transcript,
        category=category_label,
        location=system_gps,
        time=system_time
    )

    # --- STEP 5: GENERATE DOCUMENT ---
    print("\n[5/5] 📄 Creating Word Document...")
    
    # Check if report_id exists, otherwise use a default
    report_id = incident_data.get('meta', {}).get('report_id', 'Log_Unknown')
    filename = f"Incident_{report_id}.docx"
    
    create_word_report(incident_data, filename)

    print("\n" + "="*50)
    print(f"✅ DONE! Report saved as: {filename}")
    print("="*50)

# --- TEST RUN ---
if __name__ == "__main__":
    # Mock Inputs
    test_gps = "28.97, 79.41"
    test_time = "2025-12-29 10:45:00"
    
    # Update this path to where your actual audio file is located
    test_audio = os.path.join("backend", "ml", "incident_ai", "test_audio2.m4a")
    
    if os.path.exists(test_audio):
        run_gigguard_pipeline(test_audio, test_gps, test_time)
    else:
        print(f"❌ Error: File '{test_audio}' not found. Please check the path.")