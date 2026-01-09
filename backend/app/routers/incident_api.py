import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.ml.incident_ai.main_workflow import run_gigguard_pipeline

router = APIRouter()

# Temporary folder for uploads
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/api/incident/report")
async def create_incident_report(
    file: UploadFile = File(...),
    gps_coords: str = Form(...),
    user_id: str = Form(...),
    timestamp: str = Form(...)
):
    """
    Receives audio, runs the Incident AI Pipeline, and returns the report link.
    """
    try:
        # 1. Save the uploaded file temporarily
        # We need a unique name to avoid conflicts
        file_extension = file.filename.split(".")[-1] # type: ignore
        temp_filename = f"{uuid.uuid4()}.{file_extension}"
        temp_file_path = os.path.join(TEMP_DIR, temp_filename)

        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Run the AI Pipeline (Synchronously for now)
        # Note: In production, this should ideally be a background task
        result = run_gigguard_pipeline(
            user_id=user_id,
            audio_path=temp_file_path,
            system_gps=gps_coords,
            system_time=timestamp
        )

        # 3. Cleanup (Delete the temp audio file)
        os.remove(temp_file_path)

        return {
            "status": "success",
            "message": "Incident report generated successfully",
            "report_id": result["id"],
            "download_url": result["download_link"],
            "category": result["category"],
            "severity": result["severity"]
        }

    except Exception as e:
        # Clean up if something fails
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))