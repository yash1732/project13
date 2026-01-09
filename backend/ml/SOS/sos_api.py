# ============================================
# CELL 1 & 2: Import Libraries
# ============================================
import nest_asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import httpx
import asyncio
from datetime import datetime
import uvicorn
from threading import Thread
import time
from math import radians, sin, cos, sqrt, atan2

# Enable async support
nest_asyncio.apply()

# ============================================
# CELL 3: Define Data Models
# ============================================

class SOSRequest(BaseModel):
    worker_id: str = Field(..., description="Unique ID of the gig worker")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    emergency_type: str = Field(default="general")
    message: Optional[str] = None

class EmergencyContact(BaseModel):
    name: str
    type: str
    address: str
    latitude: float
    longitude: float
    distance_km: float
    phone: Optional[str] = None

class SOSResponse(BaseModel):
    sos_id: str
    timestamp: str
    worker_location: dict
    nearest_hospitals: List[EmergencyContact]
    nearest_police: List[EmergencyContact]
    nearest_pharmacies: List[EmergencyContact]  # NEW FIELD
    emergency_number: str
    status: str
    processing_time_ms: float

# ============================================
# CELL 4: Helper Functions
# ============================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance using Haversine formula"""
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return round(R * c, 2)

async def fetch_osm_raw(client: httpx.AsyncClient, lat: float, lon: float, tag: str, radius: int):
    """Fetch raw data from Overpass API"""
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:15];
    (
      node[{tag}](around:{radius},{lat},{lon});
      way[{tag}](around:{radius},{lat},{lon});
    );
    out center;
    """
    headers = {"User-Agent": "GigGuard_Safety_App/2.1", "Content-Type": "application/x-www-form-urlencoded"}

    for attempt in range(2):
        try:
            response = await client.post(overpass_url, data={"data": query}, headers=headers, timeout=20)
            if response.status_code == 200:
                return response.json().get("elements", [])
        except Exception:
            await asyncio.sleep(1)
    return []

async def fetch_places_expansive(client: httpx.AsyncClient, lat: float, lon: float, place_type: str):
    """Smart Search: 5km -> 15km -> 50km"""
    osm_tags = {
        "hospital": "amenity=hospital",
        "police": "amenity=police",
        "pharmacy": "amenity=pharmacy"  # NEW TAG
    }
    tag = osm_tags.get(place_type, "amenity=hospital")
    
    radii_options = [20000, 50000]
    elements = []
    
    for radius in radii_options:
        elements = await fetch_osm_raw(client, lat, lon, tag, radius)
        if len(elements) > 0: break
    
    places = []
    for el in elements:
        if "lat" in el: p_lat, p_lon = el["lat"], el["lon"]
        elif "center" in el: p_lat, p_lon = el["center"]["lat"], el["center"]["lon"]
        else: continue

        dist = calculate_distance(lat, lon, p_lat, p_lon)
        tags = el.get("tags", {})
        
        # Clean Address
        addr_parts = [tags.get(k) for k in ["addr:street", "addr:city"] if tags.get(k)]
        address = ", ".join(addr_parts) if addr_parts else "Address details unavailable"

        places.append(EmergencyContact(
            name=tags.get("name", f"Unnamed {place_type.capitalize()}"),
            type=place_type,
            address=address,
            latitude=p_lat,
            longitude=p_lon,
            distance_km=dist,
            phone=tags.get("phone") or tags.get("contact:phone")
        ))

    places.sort(key=lambda x: x.distance_km)
    return places[:5]

async def get_address_async(client: httpx.AsyncClient, lat: float, lon: float) -> str:
    url = "https://nominatim.openstreetmap.org/reverse"
    try:
        resp = await client.get(url, params={"lat": lat, "lon": lon, "format": "json"}, headers={"User-Agent": "GigGuard"}, timeout=5)
        return resp.json().get("display_name", f"{lat}, {lon}")
    except:
        return f"{lat}, {lon}"

# ============================================
# CELL 5: API Setup
# ============================================

app = FastAPI(title="SOS Emergency API (Async)", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/sos/trigger", response_model=SOSResponse)
async def trigger_sos(sos_request: SOSRequest):
    start_time = time.time()
    sos_id = f"SOS-{sos_request.worker_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    async with httpx.AsyncClient() as client:
        # Parallel Execution for Hospitals, Police, AND Pharmacies
        results = await asyncio.gather(
            fetch_places_expansive(client, sos_request.latitude, sos_request.longitude, "hospital"),
            fetch_places_expansive(client, sos_request.latitude, sos_request.longitude, "police"),
            fetch_places_expansive(client, sos_request.latitude, sos_request.longitude, "pharmacy"),
            get_address_async(client, sos_request.latitude, sos_request.longitude)
        )
        
        hospitals, police, pharmacies, current_address = results

    return SOSResponse(
        sos_id=sos_id,
        timestamp=datetime.now().isoformat(),
        worker_location={"latitude": sos_request.latitude, "longitude": sos_request.longitude, "address": current_address},
        nearest_hospitals=hospitals,
        nearest_police=police,
        nearest_pharmacies=pharmacies, # NEW
        emergency_number="108",
        status="active",
        processing_time_ms=round((time.time() - start_time) * 1000, 2)
    )

# ... (Run block remains same) ...
if __name__ == "__main__":
    server_thread = Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8000), daemon=True)
    server_thread.start()
    while True: time.sleep(1)

    #python backend/ml/SOS/sos_api.py