import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  MapPin, 
  AlertTriangle,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  ChevronRight
} from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const incidentTypes = [
  { id: 'accident', label: 'Accident', icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
  { id: 'harassment', label: 'Harassment', icon: <AlertCircle className="h-5 w-5 text-orange-500" /> },
  { id: 'theft', label: 'Theft', icon: <FileText className="h-5 w-5 text-yellow-500" /> },
  { id: 'near_miss', label: 'Near Miss', icon: <ClockIcon className="h-5 w-5 text-blue-500" /> },
  { id: 'road_condition', label: 'Road Condition', icon: <MapPin className="h-5 w-5 text-purple-500" /> },
  { id: 'other', label: 'Other', icon: <AlertCircle className="h-5 w-5 text-gray-500" /> },
];

function IncidentLog() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    location: '',
    anonymous: false
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Fetch incidents from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'incidents'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const incidentsList = [];
      querySnapshot.forEach((doc) => {
        incidentsList.push({ id: doc.id, ...doc.data() });
      });
      setIncidents(incidentsList);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // In a real app, you would reverse geocode the coordinates to get an address
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          
          setLocationLoading(false);
          toast.success('Location captured');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please enter it manually.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLocationLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type) {
      toast.error('Please select an incident type');
      return;
    }
    
    if (!formData.description) {
      toast.error('Please provide a description');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, you would also save to Firestore
      await addDoc(collection(db, 'incidents'), {
        userId: currentUser.uid,
        type: formData.type,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        anonymous: formData.anonymous,
        status: 'pending',
        timestamp: new Date(),
        locationCoords: currentLocation
      });
      
      toast.success('Incident reported successfully');
      setShowForm(false);
      setFormData({
        type: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
        location: '',
        anonymous: false
      });
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast.error('Failed to report incident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    const incidentType = incidentTypes.find(t => t.id === type);
    if (!incidentType) return null;
    
    return (
      <div className="flex items-center">
        {incidentType.icon}
        <span className="ml-1 text-sm font-medium text-gray-700">{incidentType.label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {showForm ? 'Report Incident' : 'Incident Log'}
              </h1>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Report
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {showForm ? (
          <div className="bg-white shadow overflow-hidden rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Incident Details</h3>
                
                {/* Incident Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Incident <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {incidentTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`relative flex items-center p-3 rounded-lg border ${
                          formData.type === type.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        } cursor-pointer`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type.id}
                          checked={formData.type === type.id}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="ml-3 flex items-center">
                          {type.icon}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {type.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                    placeholder="Please provide details about the incident..."
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="time"
                        name="time"
                        id="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="text-xs text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      {locationLoading ? (
                        'Getting location...'
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 mr-1" />
                          Use current location
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border h-10"
                    placeholder="Enter location or address"
                  />
                </div>

                {/* Anonymous Reporting */}
                <div className="flex items-center mb-6">
                  <input
                    id="anonymous"
                    name="anonymous"
                    type="checkbox"
                    checked={formData.anonymous}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                    Report anonymously
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {incidents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents reported</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by reporting a new incident.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    New Incident
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <li key={incident.id}>
                      <div className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getTypeBadge(incident.type)}
                              <span className="ml-2 text-sm text-gray-500">
                                {new Date(incident.timestamp?.toDate()).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              {getStatusBadge(incident.status)}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                {incident.location || 'Location not specified'}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              <p>
                                {new Date(incident.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {incident.description}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              {incident.anonymous ? (
                                <span className="inline-flex items-center text-xs">
                                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
                                  Anonymous Report
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs">
                                  <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                                  You reported this
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate(`/report/${incident.id}`)}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                            >
                              View details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
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
              <MapPin className="h-6 w-6" />
              <span className="text-xs mt-1">Map</span>
            </button>
            <button
              onClick={() => navigate('/sos')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs mt-1">SOS</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-3 px-4 text-indigo-600"
              disabled
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

export default IncidentLog;
