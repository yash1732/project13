import os
import json
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")) 
BASE_DATA_DIR = os.path.join(BASE_DIR, "backend", "data")
DATABASE_FILE = os.path.join(BASE_DATA_DIR, "database.json")

os.makedirs(BASE_DATA_DIR, exist_ok=True)

def save_report_and_update_db(user_id, doc_object, incident_data):
    """
    Saves the report locally as a .docx file and updates the local JSON database.
    """
    # 1. Save Local File (.docx)
    try:
        user_folder = os.path.join(BASE_DATA_DIR, user_id)
        os.makedirs(user_folder, exist_ok=True)
        filename = f"{incident_data['meta']['report_id']}.docx"
        file_path = os.path.join(user_folder, filename)
        
        doc_object.save(file_path)
        
        # Construct the download link (adjust host/port if deployed elsewhere)
        download_link = f"http://localhost:8000/data/{user_id}/{filename}"
    except Exception as e:
        print(f"❌ Local Save Failed: {e}")
        return {"error": "Could not save file locally"}

    # 2. Update Local Database (database.json)
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
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = [] # Handle corrupted/empty file
        
        existing_data.insert(0, db_entry)
        
        with open(DATABASE_FILE, 'w') as f:
            json.dump(existing_data, f, indent=4)
            
        print(f"✅ [Storage] Saved report to {filename} and updated database.json")
        
    except Exception as e:
        print(f"⚠️ Local DB Update Failed: {e}")

    return db_entry