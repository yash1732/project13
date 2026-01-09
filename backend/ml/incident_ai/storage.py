import os
import json

# --- CONFIGURATION ---
BASE_DATA_DIR = os.path.join("backend", "data")
DATABASE_FILE = os.path.join(BASE_DATA_DIR, "database.json")

# Ensure the main data folder exists
os.makedirs(BASE_DATA_DIR, exist_ok=True)

def save_report_and_update_db(user_id, doc_object, incident_data):
    """
    Saves the Word doc and updates database.json robustly.
    """
    
    # --- 1. SAVE THE FILE ---
    user_folder = os.path.join(BASE_DATA_DIR, user_id)
    os.makedirs(user_folder, exist_ok=True)

    filename = f"{incident_data['meta']['report_id']}.docx"
    file_path = os.path.join(user_folder, filename)

    doc_object.save(file_path)
    print(f"✅ Saved report to: {file_path}")

    # --- 2. UPDATE THE DATABASE (ROBUST METHOD) ---
    
    # Step A: READ existing data
    existing_data = []
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r') as f:
                existing_data = json.load(f)
        except (json.JSONDecodeError, ValueError):
            # If file is corrupted, start fresh
            existing_data = []

    # Step B: PREPARE new entry
    db_entry = {
        "user_id": user_id,
        "id": incident_data['meta']['report_id'],
        "title": incident_data.get('title', "Incident Report"),
        "description": incident_data.get('summary', "No description available"),
        "severity": incident_data.get('severity', "medium").lower(),
        "category": incident_data['category'],
        "timestamp": incident_data['time'],
        "download_link": f"/data/{user_id}/{filename}"
    }

    # Step C: APPEND & WRITE fresh
    existing_data.insert(0, db_entry) # Add to top

    with open(DATABASE_FILE, 'w') as f:
        json.dump(existing_data, f, indent=4)
        
    print(f"✅ Database updated for {user_id}")

    return db_entry