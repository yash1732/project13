import os
import json

# --- CONFIGURATION ---
# We point everything to your existing 'backend/data' folder
BASE_DATA_DIR = os.path.join("backend", "data")
DATABASE_FILE = os.path.join(BASE_DATA_DIR, "database.json")

# Ensure the main data folder exists
os.makedirs(BASE_DATA_DIR, exist_ok=True)

def save_report_and_update_db(user_id, doc_object, incident_data):
    """
    Saves the Word doc into 'backend/data/{user_id}/' 
    and updates 'backend/data/database.json'.
    """
    
    # --- 1. SAVE THE FILE ---
    # Create a specific folder for this user: backend/data/Rahul
    user_folder = os.path.join(BASE_DATA_DIR, user_id)
    os.makedirs(user_folder, exist_ok=True)

    # Define filename (using the report ID)
    filename = f"{incident_data['meta']['report_id']}.docx"
    file_path = os.path.join(user_folder, filename)

    # Save the document object
    doc_object.save(file_path)
    print(f"✅ Saved report to: {file_path}")

    # --- 2. UPDATE THE DATABASE ---
    # Create the entry that the Frontend will read
    db_entry = {
        "user_id": user_id,
        "id": incident_data['meta']['report_id'],
        "title": incident_data.get('title', "Incident Report"),
        "description": incident_data.get('summary', "No description available"),
        "severity": incident_data.get('severity', "medium").lower(),
        "category": incident_data['category'],
        "timestamp": incident_data['time'],
        # IMPORTANT: This link assumes you mount 'backend/data' in FastAPI (see step 3)
        "download_link": f"/data/{user_id}/{filename}"
    }

    # Append to the JSON list safely
    if not os.path.exists(DATABASE_FILE):
        with open(DATABASE_FILE, 'w') as f: json.dump([], f)

    try:
        with open(DATABASE_FILE, 'r+') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
            
            # Add to top of list
            data.insert(0, db_entry)
            f.seek(0)
            json.dump(data, f, indent=4)
            print(f"✅ Database updated for {user_id}")
            
    except Exception as e:
        print(f"❌ Database Error: {e}")

    return db_entry