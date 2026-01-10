import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURATION ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")) 
BASE_DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
DATABASE_FILE = os.path.join(BASE_DATA_DIR, "database.json")
KEY_PATH = os.path.join(BASE_DIR, "backend", "serviceAccountKey.json")

os.makedirs(BASE_DATA_DIR, exist_ok=True)

# --- FIREBASE SETUP (With Timeout Protection) ---
db_firestore = None

def init_firebase():
    global db_firestore
    if firebase_admin._apps: return firestore.client()

    try:
        if os.path.exists(KEY_PATH):
            cred = credentials.Certificate(KEY_PATH)
            # We don't force a connection check here to save startup time
            firebase_admin.initialize_app(cred)
            db_firestore = firestore.client()
            print("🔥 Firebase Configured (Connection will be tested on first write)")
            return db_firestore
        else:
            print(f"⚠️ Warning: Key not found at {KEY_PATH}")
            return None
    except Exception as e:
        print(f"❌ Firebase Init Error: {e}")
        return None

db_firestore = init_firebase()

def save_report_and_update_db(user_id, doc_object, incident_data):
    """
    Saves locally first, then attempts Firebase upload safely.
    """
    # 1. ALWAYS Save Local File First (This never fails)
    try:
        user_folder = os.path.join(BASE_DATA_DIR, user_id)
        os.makedirs(user_folder, exist_ok=True)
        filename = f"{incident_data['meta']['report_id']}.docx"
        file_path = os.path.join(user_folder, filename)
        doc_object.save(file_path)
        download_link = f"http://localhost:8000/data/{user_id}/{filename}"
    except Exception as e:
        print(f"❌ Local Save Failed: {e}")
        return {"error": "Could not save file locally"}

    # 2. Update Local Database
    db_entry = {
        "user_id": user_id,
        "id": incident_data['meta']['report_id'],
        "title": incident_data.get('title', "Incident Report"),
        "description": incident_data.get('summary', "No description"),
        "severity": incident_data.get('severity', "medium").lower(),
        "category": incident_data['category'],
        "timestamp": incident_data['time'],
        "download_link": download_link
    }

    try:
        existing_data = []
        if os.path.exists(DATABASE_FILE):
            with open(DATABASE_FILE, 'r') as f:
                existing_data = json.load(f)
        existing_data.insert(0, db_entry)
        with open(DATABASE_FILE, 'w') as f:
            json.dump(existing_data, f, indent=4)
        print(f"✅ [Backup] Saved to database.json")
    except Exception as e:
        print(f"⚠️ Local DB Update Failed: {e}")

    # 3. Try Firebase (Wrapped in Safety Block)
    if db_firestore:
        try:
            # We intentionally do this LAST so if it hangs, the user already has the file
            print("⏳ Attempting Cloud Sync (May take 5s)...")
            
            # Convert time
            try: dt_obj = datetime.strptime(incident_data['time'], "%Y-%m-%d %H:%M:%S")
            except: dt_obj = datetime.now()

            firestore_data = {
                "userId": user_id,
                "type": incident_data['category'].lower(), 
                "description": incident_data.get('summary', "Report"),
                "date": dt_obj.strftime("%Y-%m-%d"),
                "time": dt_obj.strftime("%H:%M"),
                "location": incident_data.get('location_context', {}).get('system_recorded_gps', 'Unknown'),
                "anonymous": False,
                "status": "resolved", 
                "timestamp": dt_obj,
                "ai_report_url": download_link,
                "severity": incident_data.get('severity', 'medium'),
                "is_ai_generated": True
            }
            
            # This is where it was hanging/crashing
            db_firestore.collection("incidents").add(firestore_data)
            print(f"🔥 [Firebase] Synced Successfully!")

        except Exception as e:
            # THIS catches the WinError 10060 or Timeout
            print(f"❌ Cloud Sync Failed (Network Issue?): {e}")
            print("   -> Data is safe locally. User won't see 500 Error.")

    return db_entry