import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURATION ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")) # Points to project root
BASE_DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
DATABASE_FILE = os.path.join(BASE_DATA_DIR, "database.json")
KEY_PATH = os.path.join(BASE_DIR, "backend", "serviceAccountKey.json")

# Ensure the main data folder exists
os.makedirs(BASE_DATA_DIR, exist_ok=True)

# --- FIREBASE SETUP ---
db_firestore = None
try:
    if os.path.exists(KEY_PATH):
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
        db_firestore = firestore.client()
        print("🔥 Firebase Connected Successfully!")
    else:
        print(f"⚠️ Warning: 'serviceAccountKey.json' not found at {KEY_PATH}")
        print("   -> System will run in 'Offline Backup Mode' (JSON only).")
except Exception as e:
    print(f"❌ Firebase Init Error: {e}")

def save_report_and_update_db(user_id, doc_object, incident_data):
    """
    Saves the Word doc, updates local JSON backup, AND pushes to Firebase.
    """
    
    # --- 1. SAVE THE WORD FILE (LOCAL) ---
    user_folder = os.path.join(BASE_DATA_DIR, user_id)
    os.makedirs(user_folder, exist_ok=True)

    filename = f"{incident_data['meta']['report_id']}.docx"
    file_path = os.path.join(user_folder, filename)

    doc_object.save(file_path)
    print(f"✅ [Local] Saved report to: {file_path}")

    # Generate a local download URL (Static file server)
    # Note: In a real production app, you would upload 'file_path' to Firebase Storage here.
    download_link = f"http://localhost:8000/data/{user_id}/{filename}"

    # --- 2. UPDATE LOCAL DATABASE (BACKUP) ---
    existing_data = []
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r') as f:
                existing_data = json.load(f)
        except (json.JSONDecodeError, ValueError):
            existing_data = []

    # Local Entry Structure
    db_entry = {
        "user_id": user_id,
        "id": incident_data['meta']['report_id'],
        "title": incident_data.get('title', "Incident Report"),
        "description": incident_data.get('summary', "No description available"),
        "severity": incident_data.get('severity', "medium").lower(),
        "category": incident_data['category'],
        "timestamp": incident_data['time'],
        "download_link": download_link
    }

    existing_data.insert(0, db_entry) # Add to top

    with open(DATABASE_FILE, 'w') as f:
        json.dump(existing_data, f, indent=4)
        
    print(f"✅ [Backup] Updated database.json")

    # --- 3. PUSH TO FIREBASE (LIVE) ---
    if db_firestore:
        try:
            # Map AI data to Frontend Schema
            # Frontend expects: type, description, date, time, location, status, timestamp
            
            # Convert string time to Firestore timestamp object
            try:
                dt_obj = datetime.strptime(incident_data['time'], "%Y-%m-%d %H:%M:%S")
            except:
                dt_obj = datetime.now()

            firestore_data = {
                "userId": user_id,
                "type": incident_data['category'].lower(), # e.g. "Accident" -> "accident"
                "description": incident_data.get('summary', "AI Generated Report") + f"\n\nFull Narrative: {incident_data['narrative'].get('objective_summary', '')}",
                "date": dt_obj.strftime("%Y-%m-%d"),
                "time": dt_obj.strftime("%H:%M"),
                "location": incident_data.get('location_context', {}).get('system_recorded_gps', 'Unknown'),
                "anonymous": False,
                "status": "resolved", # AI reports are considered 'processed'
                "timestamp": dt_obj,
                "ai_report_url": download_link,
                "severity": incident_data.get('severity', 'medium'),
                "is_ai_generated": True
            }

            # Add to 'incidents' collection
            db_firestore.collection("incidents").add(firestore_data)
            print(f"🔥 [Firebase] Incident pushed to Firestore for user: {user_id}")
            
        except Exception as e:
            print(f"❌ Firebase Write Error: {e}")
            print("   (Data is safe in local backup)")

    return db_entry