import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  AlertCircle,
  Shield,
  Crosshair,
  PhoneCall,
  User,
  Map,
  Navigation
} from 'lucide-react';

// Map container style
const containerStyle = {
  width: '100%',
  height: '50vh'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi.hospital',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'on' }]
    },
    {
      featureType: 'poi.police',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'on' }]
    }
  ]
};

// Mock emergency contacts
const emergencyContacts = [
  { id: 1, type: 'police', name: 'Police', number: '100' },
  { id: 2, type: 'ambulance', name: 'Ambulance', number: '108' },
  { id: 3, type: 'fire', name: 'Fire Department', number: '101' },
  { id: 4, type: 'emergency', name: 'Emergency Helpline', number: '112' },
];

// Mock nearby emergency services
const mockEmergencyServices = [
  {
    id: 1,
    name: 'City General Hospital',
    type: 'hospital',
    distance: '1.2 km',
    address: '123 Medical Center Dr, City',
    phone: '+1 234 567 8901',
    position: { lat: 12.9716, lng: 77.5946 },
    openNow: true
  },
  {
    id: 2,
    name: 'Central Police Station',
    type: 'police',
    distance: '0.8 km',
    address: '456 Safety Ave, City',
    phone: '+1 234 567 8902',
    position: { lat: 12.9816, lng: 77.6046 },
    openNow: true
  },
  {
    id: 3,
    name: 'Metro Fire Station',
    type: 'fire',
    distance: '2.1 km',
    address: '789 Rescue Rd, City',
    phone: '+1 234 567 8903',
    position: { lat: 12.9616, lng: 77.5846 },
    openNow: true
  }
];

function SOSPage() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [selectedService, setSelectedService] = useState(null);

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
          toast.error('Unable to retrieve your location. Using default location.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Handle emergency activation
  const handleEmergencyActivation = () => {
    if (emergencyActivated) return;
    
    setEmergencyActivated(true);
    toast.success('Emergency alert activated! Help is on the way.');
    
    // Simulate emergency response
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // In a real app, this would notify emergency contacts and services
    return () => clearInterval(timer);
  };

  const handleCancelEmergency = () => {
    setEmergencyActivated(false);
    setCountdown(5);
    toast('Emergency alert cancelled', { icon: '⚠️' });
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'hospital':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'police':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'fire':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleCall = (number) => {
    toast.success(`Calling ${number}...`);
    // In a real app, this would initiate a phone call
    console.log(`Calling ${number}`);
  };

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
            <h1 className="text-xl font-semibold text-gray-900">
              {emergencyActivated ? 'Emergency Activated' : 'Emergency SOS'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Emergency Button */}
        <div className="text-center mb-6">
          <button
            onClick={emergencyActivated ? handleCancelEmergency : handleEmergencyActivation}
            disabled={emergencyActivated}
            className={`w-full max-w-md mx-auto py-6 px-8 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all transform ${
              emergencyActivated 
                ? 'bg-green-100 border-4 border-green-500 scale-95' 
                : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white'
            }`}
          >
            {emergencyActivated ? (
              <>
                <div className="text-green-600">
                  <AlertCircle className="h-12 w-12 mx-auto animate-pulse" />
                </div>
                <span className="text-xl font-bold mt-2">HELP IS ON THE WAY</span>
                <p className="text-sm mt-2">
                  Emergency services have been notified. 
                  {countdown > 0 ? `Arriving in ${countdown}s...` : 'ETA: 5 minutes'}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEmergency();
                  }}
                  className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg font-medium text-sm border border-red-200 hover:bg-red-50"
                >
                  Cancel Emergency
                </button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-white" />
                <span className="text-2xl font-bold mt-2">SOS EMERGENCY</span>
                <p className="text-sm mt-1 opacity-90">Tap to alert emergency contacts</p>
              </>
            )}
          </button>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Emergency Contacts</h2>
          <div className="grid grid-cols-2 gap-3">
            {emergencyContacts.map((contact) => (
              <div 
                key={contact.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 rounded-full mr-3">
                    <PhoneCall className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-500">{contact.number}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCall(contact.number)}
                  className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <Phone className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Emergency Services */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900">Nearby Emergency Services</h2>
            <button 
              onClick={getCurrentLocation}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <Crosshair className="h-4 w-4 mr-1" />
              My Location
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48">
              {!loading && (
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={13}
                    options={mapOptions}
                  >
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

                    {mockEmergencyServices.map((service) => (
                      <Marker
                        key={service.id}
                        position={service.position}
                        onClick={() => setSelectedService(service)}
                        icon={{
                          url: service.type === 'hospital' 
                            ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            : service.type === 'police'
                            ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                          scaledSize: new window.google.maps.Size(32, 32)
                        }}
                      />
                    ))}

                    {selectedService && (
                      <InfoWindow
                        position={selectedService.position}
                        onCloseClick={() => setSelectedService(null)}
                      >
                        <div className="w-48">
                          <h4 className="font-medium text-gray-900">{selectedService.name}</h4>
                          <p className="text-xs text-gray-600">{selectedService.address}</p>
                          <div className="mt-2 flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {selectedService.distance} away
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              // In a real app, this would open navigation
                              toast.success(`Opening navigation to ${selectedService.name}`);
                            }}
                            className="mt-2 w-full flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Directions
                          </button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Services List */}
        <div className="mb-20">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Nearby Services</h3>
          <div className="space-y-2">
            {mockEmergencyServices.map((service) => (
              <div 
                key={service.id} 
                className="bg-white p-3 rounded-lg shadow border border-gray-100"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getServiceIcon(service.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                      <span className="text-xs text-gray-500">{service.distance}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{service.address}</p>
                    <div className="mt-2 flex space-x-2">
                      <a
                        href={`tel:${service.phone}`}
                        className="inline-flex items-center px-2.5 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </a>
                      <button
                        onClick={() => {
                          // In a real app, this would open navigation
                          toast.success(`Opening navigation to ${service.name}`);
                        }}
                        className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Map className="h-3 w-3 mr-1" />
                        Map
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <Map className="h-6 w-6" />
              <span className="text-xs mt-1">Map</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-3 px-4 text-red-600"
              disabled
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs mt-1">SOS</span>
            </button>
            <button
              onClick={() => navigate('/incident')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-xs mt-1">Incidents</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default SOSPage;
