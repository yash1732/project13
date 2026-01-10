import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Mic, Square, Send, Loader2,
  AlertTriangle, AlertCircle, FileText, MapPin, 
  Calendar, ChevronRight, Shield, X, Plus
} from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// --- CONFIGURATION ---
const API_URL = 'http://localhost:8000/api/incident/report';

const incidentTypes = [
  { id: 'accident', label: 'Accident', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'harassment', label: 'Harassment', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'theft', label: 'Theft', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'other', label: 'Other', icon: Shield, color: 'text-gray-500', bg: 'bg-gray-50' },
];

function IncidentLog() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'voice', 'manual'
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    type: 'accident',
    description: '',
    location: '',
    anonymous: false
  });

  // --- 1. FETCH INCIDENTS (Real-time) ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to Firestore
    const q = query(
      collection(db, 'incidents'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncidents(list);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // --- 2. AUDIO RECORDING LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp4' }); 
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const resetAudio = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  // --- 3. SUBMIT: VOICE REPORT (Fixed) ---
  const handleVoiceSubmit = async () => {
    if (!audioBlob) return;
    setLoading(true);

    let gpsString = "Unknown Location";
    try {
      const pos = await new Promise((resolve, reject) => 
        navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000})
      );
      gpsString = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
    } catch (e) {
      console.warn("GPS failed, sending without coords");
    }

    try {
      const data = new FormData();
      const file = new File([audioBlob], "report.m4a", { type: "audio/mp4" });
      
      data.append('file', file);
      data.append('user_id', currentUser.uid);
      data.append('gps_coords', gpsString);
      data.append('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);

      // Call Python API
      const response = await fetch(API_URL, {
        method: 'POST',
        body: data, 
      });

      if (!response.ok) throw new Error("Server Error");

      const result = await response.json(); // Python result with AI data

      // --- FIX: Add to Firestore from Frontend ---
      // Since Python no longer syncs to Firebase, we do it here.
      const now = new Date();
      await addDoc(collection(db, 'incidents'), {
        userId: currentUser.uid,
        type: result.category ? result.category.toLowerCase() : 'other',
        title: result.title || "Voice Report",
        description: result.description || "Audio report processed.",
        location: gpsString,
        anonymous: false,
        status: 'resolved',
        timestamp: now,
        date: now.toLocaleDateString(), // Required for list snippet
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Required for list snippet
        is_ai_generated: true,
        severity: result.severity || 'medium',
        ai_report_url: result.download_link
      });
      
      toast.success("Report Generated by AI!");
      resetAudio();
      setActiveTab('list'); // Switch to list to see the snippet
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to process audio.");
    } finally {
      setLoading(false);
    }
  };

// --- 4. SUBMIT: MANUAL REPORT (Fixed) ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description) return toast.error("Description required");
    setLoading(true);

    try {
      let locationStr = "Unknown";
      try {
        const pos = await new Promise((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, {timeout: 3000})
        );
        locationStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch (e) { locationStr = "Location not captured"; }

      const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
      const manualType = formData.type || 'accident';

      // Python Update (Local DB)
      let aiReportUrl = "";
      try {
        const pyResponse = await fetch('http://localhost:8000/api/incident/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.uid,
            type: manualType,
            description: formData.description,
            location: locationStr || formData.location,
            timestamp: timestamp
          })
        });
        
        if (pyResponse.ok) {
           const pyData = await pyResponse.json();
           aiReportUrl = pyData.download_link;
        }
      } catch (pyError) {
        console.warn("Python Backend unavailable");
      }

      // Firebase Update (UI List)
      // --- FIX: Added date/time strings so the snippet renders correctly ---
      const now = new Date();
      await addDoc(collection(db, 'incidents'), {
        userId: currentUser.uid,
        type: manualType,
        description: formData.description,
        location: locationStr || formData.location,
        anonymous: formData.anonymous,
        status: 'pending',
        timestamp: now,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_ai_generated: false,
        severity: 'medium',
        ai_report_url: aiReportUrl 
      });

      toast.success("Incident logged successfully");
      setFormData({ type: 'accident', description: '', location: '', anonymous: false });
      setActiveTab('list'); // Switch to list

    } catch (error) {
      console.error(error);
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // --- UI HELPERS ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 ml-2">Incident Log</h1>
          </div>
          {activeTab === 'list' && (
            <button 
              onClick={() => setActiveTab('manual')}
              className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              Manual Entry
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4">
        
        {/* --- VIEW 1: INCIDENT LIST --- */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* HERO: Voice Report CTA */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Report an Incident</h2>
                <p className="text-indigo-100 mb-6 text-sm max-w-[80%]">
                  Use AI Voice Reporting to instantly document accidents, harassment, or safety issues.
                </p>
                <button
                  onClick={() => setActiveTab('voice')}
                  className="w-full bg-white text-indigo-700 font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Mic className="h-5 w-5" />
                  Tap to Record
                </button>
              </div>
              {/* Decoration */}
              <div className="absolute -right-6 -bottom-10 opacity-20">
                <Mic className="h-40 w-40 text-white" />
              </div>
            </div>

            {/* List */}
            <h3 className="font-bold text-gray-700 mt-6">Recent Reports</h3>
            {incidents.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No incidents logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-20">
                {incidents.map((incident) => {
                  const TypeIcon = incidentTypes.find(t => t.id === incident.type)?.icon || FileText;
                  return (
                    <div 
                      key={incident.id}
                      onClick={() => navigate(`/report/${incident.id}`)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className={`p-3 rounded-full ${incident.type === 'accident' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 truncate">
                            {incident.title || incident.type?.toUpperCase() || 'INCIDENT'}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            incident.severity === 'high' ? 'bg-red-100 text-red-700' : 
                            incident.severity === 'low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {incident.severity || 'Medium'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {incident.date} • {incident.time}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {incident.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: VOICE RECORDER --- */}
        {activeTab === 'voice' && (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <h2 className="text-xl font-bold text-gray-800 mb-8">
              {audioBlob ? "Ready to Submit" : isRecording ? "Recording..." : "Voice Report"}
            </h2>

            {/* Recorder Circle */}
            <div className="relative mb-8">
              {isRecording && (
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
              )}
              <button
                onClick={isRecording ? stopRecording : audioBlob ? null : startRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                  isRecording 
                    ? 'bg-red-600 text-white scale-110' 
                    : audioBlob 
                    ? 'bg-green-100 text-green-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isRecording ? <Square className="h-12 w-12 fill-current" /> : 
                 audioBlob ? <FileText className="h-12 w-12" /> :
                 <Mic className="h-12 w-12" />}
              </button>
            </div>

            {/* Timer / Status */}
            <div className="text-2xl font-mono font-bold text-gray-700 mb-8">
              {formatTime(recordingDuration)}
            </div>

            {/* Controls */}
            {audioBlob ? (
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={handleVoiceSubmit}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                  {loading ? "Analyzing..." : "Submit Report"}
                </button>
                <button
                  onClick={resetAudio}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold"
                >
                  Discard & Retry
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center max-w-xs">
                {isRecording 
                  ? "Describe the incident clearly. Mention location, vehicles, and injuries." 
                  : "Tap the microphone to start recording."}
              </p>
            )}

            <button 
              onClick={() => { resetAudio(); setIsRecording(false); setActiveTab('list'); }}
              className="mt-12 text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* --- VIEW 3: MANUAL FORM --- */}
        {activeTab === 'manual' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Manual Entry</h2>
              <button onClick={() => setActiveTab('list')}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-5">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {incidentTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({...formData, type: t.id})}
                      className={`p-3 rounded-lg flex flex-col items-center gap-1 border transition-all ${
                        formData.type === t.id 
                          ? `${t.bg} border-${t.color.split('-')[1]}-500` 
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <t.icon className={`h-6 w-6 ${formData.type === t.id ? t.color : 'text-gray-400'}`} />
                      <span className={`text-xs font-bold ${formData.type === t.id ? 'text-gray-900' : ''}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="What happened?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="anon"
                  checked={formData.anonymous}
                  onChange={e => setFormData({...formData, anonymous: e.target.checked})}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="anon" className="text-sm text-gray-700">Submit Anonymously</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Submit Report'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default IncidentLog;