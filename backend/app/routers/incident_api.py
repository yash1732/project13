import shutil
import os
import uuid
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from backend.ml.incident_ai.main_workflow import run_gigguard_pipeline
from backend.ml.incident_ai.storage import save_report_and_update_db
from backend.ml.incident_ai.docs_generator import create_word_report

router = APIRouter()

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# --- 1. VOICE REPORT (Existing) ---
@router.post("/api/incident/report")
async def create_incident_report(
    file: UploadFile = File(...),
    gps_coords: str = Form(...),
    user_id: str = Form(...),
    timestamp: str = Form(...)
):
    try:
        file_extension = file.filename.split(".")[-1] # type: ignore
        temp_filename = f"{uuid.uuid4()}.{file_extension}"
        temp_file_path = os.path.join(TEMP_DIR, temp_filename)

        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = run_gigguard_pipeline(user_id, temp_file_path, gps_coords, timestamp)
        os.remove(temp_file_path)

        return result
    except Exception as e:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. MANUAL REPORT (NEW) ---
@router.post("/api/incident/manual")
async def create_manual_log(
    user_id: str = Body(...),
    type: str = Body(...),
    description: str = Body(...),
    location: str = Body(...),
    timestamp: str = Body(...)
):
    """
    Receives manual text data, creates a Word Doc, and updates database.json
    """
    try:
        # Create the structured data dictionary manually
        incident_data = {
            "category": type.capitalize(),
            "time": timestamp,
            "title": f"Manual {type.capitalize()} Report",
            "summary": description[:50] + "...", # First 50 chars as summary
            "severity": "medium", # Default
            "meta": {
                "report_type": "Manual Log",
                "report_id": f"inc_man_{int(time.time())}"
            },
            "narrative": {
                "objective_summary": description,
                "chronological_timeline": []
            },
            "entities": {},
            "location_context": {
                "system_recorded_gps": location,
                "transcript_mentioned_location": "N/A"
            }
        }

        # Generate Word Doc
        doc_object = create_word_report(incident_data)
        
        # Save to database.json (and Firebase if key exists)
        db_result = save_report_and_update_db(user_id, doc_object, incident_data)

        return db_result

    except Exception as e:
        print(f"Manual Log Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))