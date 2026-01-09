import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  AlertTriangle, 
  MapPin, 
  Shield, 
  Clock, 
  AlertCircle,
  Navigation
} from 'lucide-react';

// Map container style
const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 160px)'
};

// Default center (can be set to user's current location)
const defaultCenter = {
  lat: 12.9716,  // Default to a common location (e.g., city center)
  lng: 77.5946
};

// Mock risk zones data
const mockRiskZones = [
  {
    id: 1,
    position: { lat: 12.9716, lng: 77.5946 },
    riskLevel: 'high',
    description: 'High accident rate area',
    time: 'Night (8PM - 6AM)',
    reason: 'Poor lighting and high traffic violations reported.'
  },
  {
    id: 2,
    position: { lat: 12.9816, lng: 77.6046 },
    riskLevel: 'medium',
    description: 'Moderate risk zone',
    time: 'Evening (6PM - 10PM)',
    reason: 'Construction work and road diversions.'
  },
  {
    id: 3,
    position: { lat: 12.9616, lng: 77.5846 },
    riskLevel: 'low',
    description: 'Low risk area',
    time: 'All day',
    reason: 'Well-lit roads with good visibility.'
  }
];

// Map options to disable default UI controls for a cleaner look
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false
};

function SafetyMap() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [routeInput, setRouteInput] = useState('');
  const [showRouteInput, setShowRouteInput] = useState(false);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          setMapCenter(pos);
          setLoading(false);
        },
        () => {
          toast.error('Unable to retrieve your location');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMapClick = useCallback(() => {
    setSelectedZone(null);
  }, []);

  const handleZoneClick = useCallback((zone, event) => {
    event.stopPropagation();
    setSelectedZone(zone);
  }, []);

  const handleCenterChanged = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      setMapCenter({
        lat: center.lat(),
        lng: center.lng()
      });
    }
  }, [map]);

  const handleLocateMe = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const analyzeRoute = useCallback(() => {
    if (!routeInput.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    
    // In a real app, this would call an API to analyze the route
    toast.success(`Analyzing route to: ${routeInput}`);
    // Simulate analysis
    setTimeout(() => {
      toast.success('Route analysis complete. Check the map for risk zones.');
    }, 1500);
  }, [routeInput]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Safety Map</h1>
          </div>
        </div>
      </header>

      {/* Route Input */}
      <div className="px-4 mt-4">
        <div className="relative max-w-3xl mx-auto">
          <div className="flex shadow-sm rounded-md">
            <div className="relative flex-grow focus-within:z-10">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={routeInput}
                onChange={(e) => setRouteInput(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-l-md h-12"
                placeholder="Enter destination..."
                onFocus={() => setShowRouteInput(true)}
              />
            </div>
            <button
              type="button"
              onClick={analyzeRoute}
              className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="mt-4 px-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <LoadScript
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              loadingElement={<div className="h-96" />}
            >
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={14}
                onLoad={onMapLoad}
                onClick={onMapClick}
                onCenterChanged={handleCenterChanged}
                options={mapOptions}
              >
                {/* Current Location Marker */}
                {currentLocation && (
                  <Marker
                    position={currentLocation}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#3B82F6',
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: '#FFFFFF',
                    }}
                  />
                )}

                {/* Risk Zone Markers */}
                {mockRiskZones.map((zone) => (
                  <Marker
                    key={zone.id}
                    position={zone.position}
                    onClick={(e) => handleZoneClick(zone, e)}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: zone.riskLevel === 'high' ? '#EF4444' : 
                                 zone.riskLevel === 'medium' ? '#F59E0B' : '#10B981',
                      fillOpacity: 0.6,
                      strokeWeight: 2,
                      strokeColor: '#FFFFFF',
                    }}
                  />
                ))}

                {/* Info Window for Selected Zone */}
                {selectedZone && (
                  <InfoWindow
                    position={selectedZone.position}
                    onCloseClick={() => setSelectedZone(null)}
                  >
                    <div className="w-64 p-2">
                      <div className="flex items-center mb-2">
                        <div className={`h-3 w-3 rounded-full ${getRiskColor(selectedZone.riskLevel)} mr-2`}></div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {selectedZone.riskLevel} Risk Zone
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{selectedZone.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{selectedZone.time}</span>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 rounded">
                        <p className="text-xs text-yellow-700">
                          <span className="font-medium">Note:</span> {selectedZone.reason}
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          )}
        </div>
      </div>

      {/* Risk Legend */}
      <div className="px-4 mt-4 mb-20">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Risk Legend</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs text-gray-700">High Risk</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-xs text-gray-700">Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-700">Low Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between">
            <button
              onClick={handleLocateMe}
              className="flex flex-col items-center justify-center py-3 px-4 text-indigo-600"
            >
              <Navigation className="h-6 w-6" />
              <span className="text-xs mt-1">Locate Me</span>
            </button>
            <button
              onClick={() => navigate('/sos')}
              className="flex flex-col items-center justify-center py-3 px-4 text-red-600"
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs mt-1">SOS</span>
            </button>
            <button
              onClick={() => navigate('/incident')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-xs mt-1">Report</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default React.memo(SafetyMap);
