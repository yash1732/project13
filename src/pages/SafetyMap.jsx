import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import { 
  ArrowLeft, Search, Navigation, Clock, AlertTriangle, 
  MapPin, Loader, X, Crosshair, ExternalLink
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- Fix Leaflet Marker Icons ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper: Map Controller ---
function MapController({ center, bounds, onMapClick }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });

  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom());
  }, [center, map]);

  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);

  return null;
}

function SafetyMap() {
  const navigate = useNavigate();
  
  // State
  const [currentLocation, setCurrentLocation] = useState(null); 
  const [destination, setDestination] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [routeData, setRouteData] = useState(null); 
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  // Debounce Timer Ref
  const searchTimeoutRef = useRef(null);

  // --- 1. Get User Location ---
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(coords);
        },
        () => toast.error("Could not fetch location"),
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // --- 2. Live Search (Using Photon API) ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (destination && searchQuery === destination.name) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        // Using Photon API (Komoot) - Much faster & more reliable for autocomplete
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        
        // Photon returns GeoJSON. Convert to our format.
        const formattedResults = data.features.map(f => ({
          display_name: [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1], // Photon is [lon, lat]
          lon: f.geometry.coordinates[0],
          raw: f
        }));

        setSearchResults(formattedResults);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, destination]);

  // --- 3. Route Calculation (OSRM) ---
  const calculateRoute = async (start, end) => {
    if (!start || !end) return;
    
    setLoading(true);
    try {
      // OSRM requires "lng,lat"
      const url = `https://router.project-osrm.org/route/v1/bike/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        const routeInfo = {
          coords: route.geometry.coordinates.map(c => [c[1], c[0]]), // Swap for Leaflet [lat, lng]
          distanceKm: (route.distance / 1000).toFixed(2),
          durationMin: (route.duration / 60).toFixed(0),
          bounds: [
             [Math.min(start.lat, end.lat), Math.min(start.lng, end.lng)],
             [Math.max(start.lat, end.lat), Math.max(start.lng, end.lng)]
          ]
        };
        
        setRouteData(routeInfo);
        fetchRiskAnalysis(routeInfo); 
      } else {
        toast.error("No route found (too far or no path)");
      }
    } catch (err) {
      console.error(err);
      toast.error("Routing failed");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Risk Analysis (Backend) ---
  const fetchRiskAnalysis = async (routeInfo) => {
    setIsRiskLoading(true);
    try {
      const currentHour = new Date().getHours();
      const isNight = (currentHour >= 19 || currentHour < 6) ? 1 : 0;
      
      const payload = {
        route_distance_km: parseFloat(routeInfo.distanceKm),
        route_duration_min: parseFloat(routeInfo.durationMin),
        intersection_density: 1.5, 
        is_night: isNight,
        weather_stress_index: 0.5, 
        fatigue_score: 3,          
        shift_duration_hours: 4    
      };

      // Call Backend
      const res = await fetch("http://127.0.0.1:8000/predict/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Backend Error");
      
      const data = await res.json();
      setRiskData(data);
    } catch (err) {
      console.error("Risk API Error:", err);
      setRiskData({
        risk_label: "Medium",
        reasons: ["Offline Mode: Check backend connection", "General caution advised"]
      });
      // Silent toast to not annoy user if offline
      console.warn("Using offline risk estimation");
    } finally {
      setIsRiskLoading(false);
    }
  };

  // --- 5. Start Navigation (Google Maps) ---
  const startNavigation = () => {
    if (!currentLocation || !destination) return;
    
    // Correct Google Maps URL Scheme
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=bicycling`;
    
    window.open(url, '_blank');
  };

  // --- Handlers ---
  const handleMapClick = (latlng) => {
    const newDest = { lat: latlng.lat, lng: latlng.lng, name: "Marked Location" };
    setDestination(newDest);
    setSearchQuery("Marked Location");
    setSearchResults([]); 
    setRiskData(null);    
    if (currentLocation) {
      calculateRoute(currentLocation, newDest);
    }
  };

  const handleSearchResultClick = (result) => {
    const newDest = {
      lat: result.lat,
      lng: result.lon,
      name: result.display_name.split(',')[0]
    };
    setDestination(newDest);
    setSearchQuery(newDest.name);
    setSearchResults([]);
    setRiskData(null);
    if (currentLocation) {
      calculateRoute(currentLocation, newDest);
    }
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    handleMapClick(position); 
  };

  const clearRoute = () => {
    setDestination(null);
    setRouteData(null);
    setRiskData(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-500 border-red-600';
      case 'medium': return 'bg-amber-500 border-amber-600';
      case 'low': return 'bg-emerald-500 border-emerald-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header & Search */}
      <div className="bg-white shadow-sm p-4 flex items-center z-[1000] relative">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex-1 relative">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 border focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search destination..."
              className="bg-transparent w-full focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
            {destination && (
              <button onClick={clearRoute} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white mt-2 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto border border-gray-100 z-50">
              {searchResults.map((res, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSearchResultClick(res)}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{res.display_name.split(',')[0]}</p>
                    <p className="text-xs text-gray-500 truncate">{res.display_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        {!currentLocation ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Locating you...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={[currentLocation.lat, currentLocation.lng]} 
            zoom={14} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />

            <MapController 
              center={!destination && currentLocation ? [currentLocation.lat, currentLocation.lng] : null}
              bounds={routeData?.bounds}
              onMapClick={handleMapClick}
            />

            {/* Current Location */}
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>

            {/* Destination Marker */}
            {destination && (
              <Marker 
                position={[destination.lat, destination.lng]}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDragEnd }}
              >
                <Popup>{destination.name}</Popup>
              </Marker>
            )}

            {/* Route Line */}
            {routeData && (
              <Polyline 
                positions={routeData.coords} 
                color="#4F46E5" 
                weight={5} 
                opacity={0.8} 
              />
            )}
          </MapContainer>
        )}

        <button 
          onClick={getUserLocation}
          className="absolute bottom-6 right-4 bg-white p-3 rounded-full shadow-lg z-[500] hover:bg-gray-50 text-indigo-600"
        >
          <Crosshair className="w-6 h-6" />
        </button>
      </div>

      {/* Stats & Risk Panel */}
      {routeData && (
        <div className="bg-white border-t border-gray-200 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="max-w-7xl mx-auto px-4 py-4">
            
            {/* Stats Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md font-medium">
                  <Navigation className="w-4 h-4 mr-2 text-indigo-600" /> 
                  {routeData.distanceKm} km
                </span>
                <span className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md font-medium">
                  <Clock className="w-4 h-4 mr-2 text-indigo-600" /> 
                  {routeData.durationMin} min
                </span>
              </div>
            </div>

            {/* Loading State */}
            {isRiskLoading && (
              <div className="p-6 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                <Loader className="w-5 h-5 animate-spin mr-3 text-indigo-600" />
                <span className="text-sm font-medium">Calculating safety score...</span>
              </div>
            )}

            {/* Risk Result */}
            {!isRiskLoading && riskData && (
              <div className={`rounded-xl border-l-4 overflow-hidden shadow-sm ${getRiskColor(riskData.risk_label)} bg-opacity-10`}>
                <div className="bg-white p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${getRiskColor(riskData.risk_label).split(' ')[0]}`}></span>
                      {riskData.risk_label} Risk
                    </h3>
                    <span className="text-xs font-mono text-gray-400">
                      {riskData.risk_probabilities ? `CONF: ${((riskData.risk_probabilities[riskData.risk_label] || 0.85) * 100).toFixed(0)}%` : 'OFFLINE'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {riskData.reasons?.map((reason, idx) => (
                      <div key={idx} className="flex items-start text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={startNavigation}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-gray-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Start Navigation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(SafetyMap);