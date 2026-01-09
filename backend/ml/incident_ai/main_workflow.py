import os
import time

# --- IMPORT MODULES ---
from transcribe import process_incident_audio
from generate_report import generate_incident_json
from docs_generator import create_word_report
# Import the new storage logic
from storage import save_report_and_update_db 

def run_gigguard_pipeline(user_id, audio_path, system_gps, system_time):
    print("\n" + "="*50)
    print(f"🚀 STARTING GIGGUARD PIPELINE FOR USER: {user_id}")
    print("="*50)

    # --- STEP 1: TRANSCRIPTION & CLASSIFICATION ---
    print(f"\n[1/5] 🎧 Processing Audio (Transcribing + Classifying)...")
    
    # Returns: {'transcription': "...", 'category': "...", 'title': "...", 'severity': "..."}
    ai_result = process_incident_audio(audio_path)
    
    raw_transcript = ai_result['transcription']
    initial_category = ai_result['category'] 
    
    # Capture extra metadata if your prompt provides it
    ai_title = ai_result.get('title')
    ai_severity = ai_result.get('severity')
    ai_summary = ai_result.get('summary')

    # --- STEP 2: HUMAN VERIFICATION ---
    print("\n[2/5] ✍️  Verification Required")
    print("-" * 30)
    print(f"AI Heard: \"{raw_transcript}\"")
    print("-" * 30)
    
    # NOTE: For backend automation (API calls), we typically skip user input.
    # If running manually in terminal, keep this. If calling from app.py, comment out input().
    # choice = input("Is this correct? (y/n): ").lower().strip()
    # if choice == 'n':
    #     final_transcript = input("Correction > ")
    # else:
    final_transcript = raw_transcript
        
    print(f"✅ Transcript Locked")

    # --- STEP 3: CATEGORY CONFIRMATION ---
    print("\n[3/5] 🧠 Category Detection...")
    category_label = initial_category
    print(f"   -> AI Classified audio as: {category_label}")

    # --- STEP 4: GENERATE STRUCTURED JSON ---
    print("\n[4/5] 📊 Generating Structured Report Data...")
    
    incident_data = generate_incident_json(
        transcription=final_transcript,
        category=category_label,
        location=system_gps,
        time=system_time
    )

    # --- DATA SANITIZATION (Fixing missing keys for Storage) ---
    
    # 1. Ensure 'category' exists at the top level (Storage needs this)
    if 'category' not in incident_data:
        incident_data['category'] = category_label

    # 2. Ensure 'time' exists at the top level
    if 'time' not in incident_data:
        incident_data['time'] = system_time

    # 3. Ensure 'meta' and 'report_id' exist (Critical for filenames)
    if 'meta' not in incident_data:
        incident_data['meta'] = {}
        
    if 'report_id' not in incident_data['meta']:
        incident_data['meta']['report_id'] = f"inc_{int(time.time())}"

    # 4. Inject AI Metadata (Title/Severity/Summary) if available
    if ai_title: incident_data['title'] = ai_title
    if ai_severity: incident_data['severity'] = ai_severity
    if ai_summary: incident_data['summary'] = ai_summary

    # --- STEP 5: SAVE DOC & UPDATE DATABASE ---
    print("\n[5/5] 💾 Saving to User Folder & Database...")
    
    # 1. Create the Doc Object (Do NOT pass a filename, so it returns the object)
    doc_object = create_word_report(incident_data)
    
    # 2. Hand off to storage module
    # This creates the folder, saves the file, and updates database.json
    db_result = save_report_and_update_db(user_id, doc_object, incident_data)

    print("\n" + "="*50)
    print(f"✅ DONE! Report saved.")
    print(f"🔗 Download Link: {db_result['download_link']}")
    print("="*50)
    
    return db_result

# --- TEST RUN ---
if __name__ == "__main__":
    # Mock Inputs
    test_user = "user_3" # <--- Simulating a specific user
    test_gps = "28.97, 79.41"
    test_time = "2025-12-29 10:45:00"
    
    test_audio = os.path.join("backend", "ml", "incident_ai", "test_audio2.m4a")
    
    if os.path.exists(test_audio):
        run_gigguard_pipeline(test_user, test_audio, test_gps, test_time)
    else:
        print(f"❌ Error: File '{test_audio}' not found. Please check the path.")