import { useState } from 'react';
import { MapPin, AlertTriangle, Clock, Shield, FileText, Sun, CloudRain, Cloud, AlertCircle } from 'lucide-react';

const Home = () => {
  const [destination, setDestination] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium'); // 'low', 'medium', 'high'
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // Mock weather data - in a real app, this would come from an API
  const weather = {
    temp: '32°C',
    condition: 'sunny', // 'rainy', 'cloudy'
  };

  const renderWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      default:
        return <Cloud className="w-6 h-6 text-slate-400" />;
    }
  };

  const getRiskBadge = () => {
    const riskStyles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-red-100 text-red-800'
    };
    
    const riskIcons = {
      low: '🟢',
      medium: '⚠️',
      high: '🔴'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskStyles[riskLevel]}`}>
        {riskIcons[riskLevel]} {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    );
  };

  const handleEmergencyClick = () => {
    setEmergencyMode(true);
    // In a real app, this would trigger emergency protocols
    alert('Emergency alert sent to authorities! Help is on the way!');
    setTimeout(() => setEmergencyMode(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Hi, Rider</h1>
              <div className="mt-1">{getRiskBadge()}</div>
            </div>
            <div className="flex items-center space-x-2">
              {renderWeatherIcon()}
              <span className="text-slate-700">{weather.temp}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Route Safety Card */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Check Route Safety</h2>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you going?"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => alert(`Analyzing route to ${destination}...`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Go
            </button>
          </div>
        </div>

        {/* Emergency Button */}
        <div className="text-center">
          <button
            onClick={handleEmergencyClick}
            disabled={emergencyMode}
            className={`w-full py-5 rounded-2xl font-bold text-white text-lg flex flex-col items-center justify-center space-y-2 transition-all transform ${emergencyMode ? 'bg-red-600 scale-95' : 'bg-red-500 hover:bg-red-600 active:scale-95'}`}
          >
            <AlertCircle className="w-8 h-8 text-white" />
            <span>{emergencyMode ? 'HELP IS ON THE WAY' : 'SOS EMERGENCY'}</span>
          </button>
          <p className="text-sm text-slate-500 mt-2">One-tap for Police/Ambulance</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Log Incident */}
          <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-slate-800">Log Incident</h3>
            <p className="text-sm text-slate-500 mt-1">Report accident or harassment</p>
          </button>

          {/* Fatigue Check */}
          <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-medium text-slate-800">Fatigue Check</h3>
            <p className="text-sm text-slate-500 mt-1">4h 30m on shift. Take a break?</p>
          </button>

          {/* Safe Zones */}
          <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium text-slate-800">Safe Zones</h3>
            <p className="text-sm text-slate-500 mt-1">Find nearby safe rest areas</p>
          </button>

          {/* My Reports */}
          <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-slate-800">My Reports</h3>
            <p className="text-sm text-slate-500 mt-1">View generated insurance reports</p>
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="flex justify-around">
          <button className="flex flex-col items-center justify-center py-3 px-4 text-blue-600">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center py-3 px-4 text-slate-500">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-xs mt-1">Map</span>
          </button>
          <button className="flex flex-col items-center justify-center py-3 px-4 text-slate-500">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Reports</span>
          </button>
          <button className="flex flex-col items-center justify-center py-3 px-4 text-slate-500">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Home;
