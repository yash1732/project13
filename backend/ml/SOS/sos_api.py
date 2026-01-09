# ============================================
# CELL 1 & 2: Import Libraries
# ============================================
import nest_asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import requests
from datetime import datetime
import uvicorn
from threading import Thread
import time

# Enable async support (useful if running in notebooks, harmless in scripts)
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
    emergency_number: str
    status: str

# ============================================
# CELL 4: Helper Functions
# ============================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2

    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return round(R * c, 2)

def fetch_nearby_places(latitude: float, longitude: float, place_type: str, radius: int = 5000):
    """Fetch nearby places using OSM Overpass API with Retry Logic"""

    osm_tags = {
        "hospital": "amenity=hospital",
        "clinic": "amenity=clinic",
        "police": "amenity=police",
        "pharmacy": "amenity=pharmacy",
        "fire_station": "amenity=fire_station"
    }

    tag = osm_tags.get(place_type, "amenity=hospital")
    # CHANGE 1: Use HTTPS
    overpass_url = "https://overpass-api.de/api/interpreter"
    
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node[{tag}](around:{radius},{latitude},{longitude});
      way[{tag}](around:{radius},{latitude},{longitude});
    );
    out center;
    """

    # CHANGE 2: Add proper User-Agent headers to avoid being blocked
    headers = {
        "User-Agent": "GigGuard_Safety_App/1.0",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    # CHANGE 3: Retry Loop (Try 3 times before giving up)
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(overpass_url, data={"data": overpass_query}, headers=headers, timeout=30)
            
            # If rate limited (429) or server error (5xx), wait and retry
            if response.status_code in [429, 500, 502, 503, 504]:
                time.sleep(2)  # Wait 2 seconds
                continue

            # Check if valid JSON
            try:
                data = response.json()
            except ValueError:
                # This usually happens if API sends back HTML error text instead of JSON
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                else:
                    print(f"❌ API Error: Received invalid response for {place_type}")
                    return []

            places = []
            for element in data.get("elements", []):
                if "lat" in element and "lon" in element:
                    place_lat, place_lon = element["lat"], element["lon"]
                elif "center" in element:
                    place_lat, place_lon = element["center"]["lat"], element["center"]["lon"]
                else:
                    continue

                distance = calculate_distance(latitude, longitude, place_lat, place_lon)
                tags = element.get("tags", {})
                name = tags.get("name", f"Unnamed {place_type}")

                address_parts = []
                for key in ["addr:street", "addr:city", "addr:postcode"]:
                    if key in tags:
                        address_parts.append(tags[key])
                address = ", ".join(address_parts) if address_parts else "Address not available"

                places.append({
                    "name": name,
                    "latitude": place_lat,
                    "longitude": place_lon,
                    "distance_km": distance,
                    "address": address,
                    "phone": tags.get("phone", tags.get("contact:phone"))
                })

            places.sort(key=lambda x: x["distance_km"])
            return places[:5]

        except Exception as e:
            # print(f"⚠️ Attempt {attempt+1} failed for {place_type}: {e}")
            time.sleep(1)

    print(f"❌ Failed to fetch {place_type} after {max_retries} attempts.")
    return []

def get_address_from_coords(latitude: float, longitude: float) -> str:
    """Reverse geocoding using Nominatim"""
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"lat": latitude, "lon": longitude, "format": "json"}
    headers = {"User-Agent": "GigWorkerSafetyApp/1.0"}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        data = response.json()
        return data.get("display_name", f"{latitude}, {longitude}")
    except:
        return f"{latitude}, {longitude}"

# ============================================
# CELL 5: Create FastAPI App
# ============================================

app = FastAPI(title="SOS Emergency API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "SOS API is running", "status": "active"}

@app.post("/api/sos/trigger", response_model=SOSResponse)
async def trigger_sos(sos_request: SOSRequest):
    """Main SOS endpoint"""
    try:
        sos_id = f"SOS-{sos_request.worker_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        current_address = get_address_from_coords(sos_request.latitude, sos_request.longitude)

        print("🏥 Fetching hospitals...")
        hospitals_data = fetch_nearby_places(sos_request.latitude, sos_request.longitude, "hospital")

        if len(hospitals_data) < 3:
            clinics_data = fetch_nearby_places(sos_request.latitude, sos_request.longitude, "clinic")
            hospitals_data.extend(clinics_data)
            hospitals_data = sorted(hospitals_data, key=lambda x: x["distance_km"])[:5]

        print("🚓 Fetching police stations...")
        police_data = fetch_nearby_places(sos_request.latitude, sos_request.longitude, "police")

        hospitals = [EmergencyContact(**h, type="hospital") for h in hospitals_data]
        police = [EmergencyContact(**p, type="police") for p in police_data]

        return SOSResponse(
            sos_id=sos_id,
            timestamp=datetime.now().isoformat(),
            worker_location={"latitude": sos_request.latitude, "longitude": sos_request.longitude, "address": current_address},
            nearest_hospitals=hospitals,
            nearest_police=police,
            emergency_number="108",
            status="active"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sos/test")
async def test_sos():
    """Test endpoint with sample location"""
    test_request = SOSRequest(
        worker_id="TEST123",
        latitude=28.6139,  # Delhi
        longitude=77.2090,
        emergency_type="test"
    )
    return await trigger_sos(test_request)

# ============================================
# CELL 6, 7, 8: SERVER & TESTING (Only runs in __main__)
# ============================================

if __name__ == "__main__":
    def run_server():
        """Run FastAPI server"""
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

    # Start server in background thread
    server_thread = Thread(target=run_server, daemon=True)
    server_thread.start()

    print("⏳ Starting server...")
    time.sleep(3)
    print("✅ Server is running on http://127.0.0.1:8000")
    print("📚 API Docs: http://127.0.0.1:8000/docs")

    # --- TEST THE API ---

    print("\n" + "="*50)
    print("🧪 TESTING SOS API")
    print("="*50)

    # Test 1: Health check
    print("\n1️⃣ Testing health check...")
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Server check failed: {e}")

    # Test 2: Quick test endpoint (Delhi location)
    print("\n2️⃣ Testing with sample Delhi location...")
    try:
        response = requests.get("http://127.0.0.1:8000/api/sos/test")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\n📍 Location: {data['worker_location']['address'][:80]}...")
            print(f"🆔 SOS ID: {data['sos_id']}")
            print(f"🏥 Hospitals found: {len(data['nearest_hospitals'])}")
            print(f"🚓 Police stations found: {len(data['nearest_police'])}")

            if data['nearest_hospitals']:
                print(f"\nClosest hospital: {data['nearest_hospitals'][0]['name']}")
                print(f"Distance: {data['nearest_hospitals'][0]['distance_km']} km")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Test 2 failed: {e}")

    # Test 3: Custom location (Mumbai example)
    print("\n3️⃣ Testing with custom location (Mumbai)...")
    sos_data = {
        "worker_id": "WORKER_789",
        "latitude": 19.0760,  # Mumbai
        "longitude": 72.8777,
        "emergency_type": "accident",
        "message": "Bike accident near market"
    }

    try:
        response = requests.post("http://127.0.0.1:8000/api/sos/trigger", json=sos_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SOS triggered successfully!")
            print(f"Location: {data['worker_location']['address'][:80]}...")
            print(f"Emergency services found: {len(data['nearest_hospitals']) + len(data['nearest_police'])}")
    except Exception as e:
        print(f"❌ Test 3 failed: {e}")

    print("\n" + "="*50)
    print("✨ All tests completed!")
    print("="*50)

    # --- Interactive Testing Function ---
    def test_custom_location(lat, lon, worker_id="TEST"):
        """Test SOS with custom coordinates"""
        print(f"\n🔍 Testing location: {lat}, {lon}")

        sos_data = {
            "worker_id": worker_id,
            "latitude": lat,
            "longitude": lon,
            "emergency_type": "test"
        }

        try:
            response = requests.post("http://127.0.0.1:8000/api/sos/trigger", json=sos_data)

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success!")
                print(f"📍 {data['worker_location']['address'][:100]}")
                print(f"\n🏥 Nearest Hospitals:")
                for i, h in enumerate(data['nearest_hospitals'][:3], 1):
                    print(f"  {i}. {h['name']} - {h['distance_km']} km")
                print(f"\n🚓 Nearest Police Stations:")
                for i, p in enumerate(data['nearest_police'][:3], 1):
                    print(f"  {i}. {p['name']} - {p['distance_km']} km")
            else:
                print(f"❌ Error: {response.status_code}")
        except Exception as e:
            print(f"❌ Connection error: {e}")

    # Example: Test with Bangalore location
    print("\n🌟 Example: Testing Bangalore location")
    test_custom_location(27.5724, 77.6774, "BANGALORE_001")
    
    # Keep the main thread alive so the server doesn't shut down immediately
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Stopping server...")