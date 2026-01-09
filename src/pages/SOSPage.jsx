import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  ArrowLeft, Phone, Navigation, 
  Shield, AlertCircle, PlusSquare, MapPin 
} from 'lucide-react';

// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- HELPER COMPONENT: Auto-Center Map ---
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
}

// --- CONSTANTS ---
const TABS = [
  { id: 'all', label: 'All', icon: MapPin },
  { id: 'police', label: 'Police', icon: Shield },
  { id: 'hospital', label: 'Health', icon: AlertCircle },
  { id: 'pharmacy', label: 'Meds', icon: PlusSquare },
];

function SOSPage() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [allServices, setAllServices] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // 1. Get Location & Fetch Data
  // 1. Create the "Sticky Note" (Ref)
  const scanStarted = React.useRef(false);

  // 2. The Effect Hook
  useEffect(() => {
    // CHECK THE NOTE:
    // If we have already started (true), stop right here.
    if (scanStarted.current) return;

    // MARK THE NOTE:
    // Set it to true so the next run knows to stop.
    scanStarted.current = true;

    // --- ACTUAL LOGIC STARTS HERE ---
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setLoading(false);
      return;
    }

    const toastId = toast.loading('Scanning nearby area...');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation([latitude, longitude]);
        fetchNearbyHelp(latitude, longitude, toastId);
      },
      (err) => {
        console.error(err);
        toast.error('Could not get location. Check GPS permissions.', { id: toastId });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearbyHelp = async (lat, lng, toastId) => {
    try {
      const response = await fetch('http://localhost:8000/api/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: "MOBILE_USER",
          latitude: lat,
          longitude: lng,
          emergency_type: "general"
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const combined = [
          ...data.nearest_hospitals.map(h => ({ ...h, type: 'hospital' })),
          ...data.nearest_police.map(p => ({ ...p, type: 'police' })),
          ...data.nearest_pharmacies.map(ph => ({ ...ph, type: 'pharmacy' }))
        ];
        
        // Sort by distance
        combined.sort((a, b) => a.distance_km - b.distance_km);
        
        setAllServices(combined);
        toast.success(`Found ${combined.length} places`, { id: toastId });
      } else {
        toast.error('Failed to load data', { id: toastId });
      }
    } catch (error) {
      toast.error('Server offline', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 2. Filter Logic
  const filteredServices = allServices.filter(s => 
    activeTab === 'all' ? true : s.type === activeTab
  );

  // 3. Helpers for Visuals
  const getTheme = (type) => {
    switch (type) {
      case 'police': return {
        bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', 
        icon: <Shield className="w-6 h-6 text-blue-600" fill="currentColor" fillOpacity={0.2} />
      };
      case 'hospital': return {
        bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', 
        icon: <AlertCircle className="w-6 h-6 text-red-600" fill="currentColor" fillOpacity={0.2} />
      };
      case 'pharmacy': return {
        bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', 
        icon: <PlusSquare className="w-6 h-6 text-green-600" fill="currentColor" fillOpacity={0.2} />
      };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: null };
    }
  };

  const handleNavigate = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nearby Help</h1>
        </div>
        <div className="flex gap-2">
           {/* Quick Dial 100/108 */}
           <a href="tel:100" className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm shadow">
             100
           </a>
           <a href="tel:108" className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm shadow">
             108
           </a>
        </div>
      </div>

      {/* --- MAP SECTION (Fixed Height) --- */}
      <div className="h-[35vh] w-full relative z-0 shadow-inner">
        {currentLocation ? (
          <MapContainer center={currentLocation} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={currentLocation} />
            <Marker position={currentLocation}>
              <Popup>You</Popup>
            </Marker>
            {filteredServices.map((s, i) => (
              <Marker key={i} position={[s.latitude, s.longitude]}>
                <Popup>{s.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-200 text-gray-500 animate-pulse">
            Loading Map...
          </div>
        )}
      </div>

      {/* --- LIST SECTION --- */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 pt-6 pb-20">
        
        {/* Filter Tabs */}
        <div className="flex justify-between gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-w-[70px]
                  ${isActive ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-500 border border-gray-100'}
                `}
              >
                <tab.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="text-xs font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {loading ? (
             <p className="text-center text-gray-400 mt-10">Scanning...</p>
          ) : filteredServices.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200">
               <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2"/>
               <p className="text-gray-500 font-medium">No places found in this category.</p>
             </div>
          ) : (
            filteredServices.map((service, index) => {
              const theme = getTheme(service.type);
              return (
                <div 
                  key={index} 
                  className={`relative p-4 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm transition-transform active:scale-[0.99]`}
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4 text-xs font-bold bg-white px-2 py-1 rounded-md shadow-sm text-gray-600 border border-gray-100">
                    {service.distance_km} km
                  </div>

                  <div className="flex gap-4 items-start mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      {theme.icon}
                    </div>
                    <div className="flex-1 pr-12">
                      <h3 className={`font-bold text-lg leading-tight ${theme.text} mb-1`}>
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.address}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {service.phone ? (
                      <a
                        href={`tel:${service.phone}`}
                        className="flex-1 bg-white border border-gray-200 text-gray-800 py-3 rounded-xl font-bold text-center shadow-sm flex items-center justify-center gap-2 active:bg-gray-50"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    ) : (
                      <div className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-medium text-center text-sm flex items-center justify-center cursor-not-allowed">
                        No Number
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleNavigate(service.latitude, service.longitude)}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 active:bg-indigo-700"
                    >
                      <Navigation className="w-4 h-4" />
                      Go
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default SOSPage;