import os
import time

# --- IMPORT YOUR MODULES ---
# Assuming these are the filenames of your scripts
from transcribe import transcribe_audio
from model import predict_category
from generate_report import generate_incident_json
from docs_generator import create_word_report

def run_gigguard_pipeline(audio_path, system_gps, system_time):
    print("\n" + "="*50)
    print("🚀 STARTING GIGGUARD PIPELINE")
    print("="*50)

    # --- STEP 1: TRANSCRIPTION ---
    print(f"\n[1/5] 🎧 Transcribing Audio: {audio_path}...")
    raw_transcript = transcribe_audio(audio_path)
    
    # --- STEP 2: HUMAN VERIFICATION (The "Edit" Step) ---
    print("\n[2/5] ✍️  Verification Required")
    print("-" * 30)
    print(f"AI Heard: \"{raw_transcript}\"")
    print("-" * 30)
    
    # In a real app, this would be a text box on the Frontend.
    # Here, we simulate it with console input.
    choice = input("Is this correct? (y/n): ").lower().strip()
    
    if choice == 'n':
        print("\n> Please type the corrected version below:")
        final_transcript = input("> ")
    else:
        final_transcript = raw_transcript
        
    print(f"\n✅ Transcript Locked: \"{final_transcript[:50]}...\"")

    # --- STEP 3: CATEGORY CLASSIFICATION ---
    print("\n[3/5] 🧠 Identifying Category...")
    # Your model.py analyzes the text to tag it (Accident, Theft, etc.)
    category_label = predict_category(final_transcript)
    print(f"   -> Classified as: {category_label}")

    # --- STEP 4: GENERATE STRUCTURED JSON ---
    print("\n[4/5] 📊 Generating Structured Report Data...")
    # Your report_generator.py sends data to LLM (Gemini) to get the JSON
    incident_data = generate_incident_json(
        transcription=final_transcript,
        category=category_label,
        location=system_gps,
        time=system_time
    )
    
    # Save JSON locally (optional debug step)
    # import json
    # with open("debug_data.json", "w") as f: json.dump(incident_data, f, indent=2)

    # --- STEP 5: GENERATE DOCUMENT ---
    print("\n[5/5] 📄 Creating Word Document...")
    filename = f"Incident_{incident_data['meta'].get('report_id', 'Log')}.docx"
    create_word_report(incident_data, filename)

    print("\n" + "="*50)
    print(f"✅ DONE! Report saved as: {filename}")
    print("="*50)

# --- TEST RUN ---
if __name__ == "__main__":
    # Mock Inputs
    test_audio = "user_recording.mp3"
    test_gps = "28.97, 79.41"
    test_time = "2025-12-29 10:45:00"
    
    # Check if file exists so script doesn't crash
    test_audio="backend\\ml\\incident_ai\\test_audio2.m4a"
    if os.path.exists(test_audio):
        run_gigguard_pipeline(test_audio, test_gps, test_time)
    else:
        print(f"Error: File '{test_audio}' not found. Please add a dummy audio file to test.")