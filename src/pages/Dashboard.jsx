import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Map, 
  AlertTriangle, 
  FileText, 
  LogOut,
  Battery,
  Zap,
  Clock,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Snowflake,
  Navigation,
  ChevronRight,
  ShieldAlert,
  Loader
} from 'lucide-react';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Weather State ---
  const [weather, setWeather] = useState({ temp: '--', code: 0, loading: true });

  // --- 1. Fetch Live Weather (Open-Meteo Free API) ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await res.json();
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode,
            loading: false
          });
        } catch (error) {
          console.error("Weather fetch failed", error);
          setWeather(prev => ({ ...prev, loading: false }));
        }
      }, () => {
        toast.error("Enable location for weather updates");
        setWeather(prev => ({ ...prev, loading: false }));
      });
    }
  }, []);

  const getWeatherIcon = (code) => {
    if (code >= 95) return CloudLightning; // Thunderstorm
    if (code >= 71) return Snowflake;      // Snow
    if (code >= 51) return CloudRain;      // Rain
    if (code >= 1) return Cloud;           // Cloudy
    return Sun;                            // Clear (0)
  };

  const WeatherIcon = getWeatherIcon(weather.code);

  // --- Mock Data (To be connected later) ---
  const fatigueData = {
    score: 35, 
    level: 'Low',
    status: 'Good to Ride',
    shiftDuration: '4h 12m'
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const getFatigueColor = (level) => {
    if (level === 'High') return 'bg-red-500 text-red-50';
    if (level === 'Medium') return 'bg-amber-500 text-amber-50';
    return 'bg-emerald-500 text-emerald-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 select-none">
      
      {/* Header */}
      <header className="bg-white px-6 py-5 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Hi, {currentUser?.email?.split('@')[0] || 'Rider'}
          </h1>
          <p className="text-xs text-gray-400">Ride Safe • {new Date().toLocaleDateString()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="px-5 py-6 space-y-6">

        {/* --- Context Widget (Live Weather & Shift) --- */}
        <div className="flex space-x-3">
          {/* Weather Card */}
          <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${weather.loading ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
              {weather.loading ? <Loader className="w-5 h-5 animate-spin text-gray-400"/> : <WeatherIcon className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Weather</p>
              <p className="text-sm font-bold text-gray-700">
                {weather.loading ? '--' : `${weather.temp}°C`}
              </p>
            </div>
          </div>
          
          {/* Shift Timer Card */}
          <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">On Shift</p>
              <p className="text-sm font-bold text-gray-700">{fatigueData.shiftDuration}</p>
            </div>
          </div>
        </div>

        {/* --- Fatigue Monitor (Visual Hero) --- */}
        <div className={`rounded-3xl p-6 shadow-lg relative overflow-hidden transition-all ${getFatigueColor(fatigueData.level)}`}>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold opacity-90">Rider Energy</h2>
                <p className="text-sm opacity-75">Fatigue Risk Monitor</p>
              </div>
              <Battery className="w-8 h-8 opacity-80" />
            </div>

            <div className="w-full bg-black/10 h-3 rounded-full mb-3 overflow-hidden">
              <div 
                className="h-full bg-white opacity-90 rounded-full transition-all duration-1000" 
                style={{ width: `${100 - fatigueData.score}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-bold">{fatigueData.level}</span>
                <span className="text-sm ml-1 opacity-75">Risk</span>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                  {fatigueData.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Primary Action: Route Planner --- */}
        <Link to="/map" className="block group">
          <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white flex items-center justify-between transform transition-transform active:scale-[0.98]">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Check Route Safety</h3>
                <p className="text-indigo-100 text-xs">Analyze risks before you ride</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-indigo-200 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* --- Secondary Actions Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/incident" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-700">Log Incident</h3>
            <p className="text-xs text-gray-400 mt-1">Report accidents</p>
          </Link>

          <Link to="/incident" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-700">My Reports</h3>
            <p className="text-xs text-gray-400 mt-1">View history</p>
          </Link>
        </div>

        {/* --- SOS Button (Reverted to Button) --- */}
        <div className="bg-red-50 rounded-2xl p-1 border border-red-100 mt-4">
            <Link 
                to="/sos"
                className="flex items-center justify-center space-x-2 bg-red-600 text-white w-full py-4 rounded-xl shadow-lg shadow-red-200 active:bg-red-700 transition-colors"
            >
                <ShieldAlert className="w-6 h-6" />
                <span className="font-bold tracking-wide">EMERGENCY SOS</span>
            </Link>
        </div>

      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center pb-safe z-50">
        <Link to="/dashboard" className="flex flex-col items-center text-indigo-600">
          <Zap className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </Link>
        <Link to="/map" className="flex flex-col items-center text-gray-400 hover:text-indigo-600 transition-colors">
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Map</span>
        </Link>
        <Link to="/sos" className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
          <ShieldAlert className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">SOS</span>
        </Link>
        <Link to="/incident" className="flex flex-col items-center text-gray-400 hover:text-indigo-600 transition-colors">
          <FileText className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Logs</span>
        </Link>
      </nav>
    </div>
  );
}

export default Dashboard;