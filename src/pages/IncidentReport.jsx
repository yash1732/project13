import { toast } from "react-hot-toast";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Share2, 
  AlertTriangle,
  MapPin, 
  Clock, 
  Calendar, 
  FileText,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Map
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';

// This would be replaced with actual AI analysis in a real app
const generateAIAnalysis = (incident) => {
  // Mock AI analysis based on incident type
  const analysis = {
    summary: `This ${incident.type.replace('_', ' ')} incident was reported on ${new Date(incident.timestamp?.toDate()).toLocaleDateString()} at ${new Date(incident.timestamp?.toDate()).toLocaleTimeString()}.`,
    riskAssessment: {
      level: 'Medium',
      factors: ['Time of day', 'Location type', 'Previous incidents in the area']
    },
    recommendedActions: [
      'File a police report if not already done',
      'Seek medical attention if injured',
      'Notify your employer about the incident',
      'Document any evidence (photos, witness contacts)'
    ],
    legalConsiderations: [
      'You may be entitled to workers compensation',
      'Report to local authorities within 24 hours',
      'Keep all medical records and receipts'
    ]
  };

  // Customize based on incident type
  switch(incident.type) {
    case 'accident':
      analysis.summary = `A traffic accident was reported involving the rider. ${analysis.summary}`;
      analysis.riskAssessment.level = 'High';
      analysis.riskAssessment.factors.push('Road conditions', 'Vehicle type');
      break;
    case 'harassment':
      analysis.summary = `A harassment incident was reported by the rider. ${analysis.summary}`;
      analysis.riskAssessment.level = 'High';
      analysis.recommendedActions.unshift('Contact local support services');
      break;
    case 'theft':
      analysis.summary = `A theft incident was reported. ${analysis.summary}`;
      analysis.riskAssessment.level = 'Medium';
      analysis.recommendedActions.unshift('Cancel any stolen payment methods');
      break;
    default:
      break;
  }

  return analysis;
};

// Component for the printable report
const PrintableReport = React.forwardRef(({ incident, analysis, currentUser }, ref) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Resolved</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      accident: 'Traffic Accident',
      harassment: 'Harassment',
      theft: 'Theft',
      near_miss: 'Near Miss',
      road_condition: 'Road Condition',
      other: 'Other'
    };
    return types[type] || 'Incident';
  };

  return (
    <div ref={ref} className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Incident Report</h1>
        <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {getTypeLabel(incident.type)} - {incident.id.substring(0, 8).toUpperCase()}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Reported by: {incident.anonymous ? 'Anonymous' : currentUser?.email}
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              {getStatusBadge(incident.status)}
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Incident Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p className="text-sm text-gray-900">
                  {new Date(incident.timestamp?.toDate()).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-sm text-gray-900">
                  {incident.location || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
              {incident.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Safety Analysis</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h4>
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Risk Level:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                analysis.riskAssessment.level === 'High' ? 'bg-red-100 text-red-800' :
                analysis.riskAssessment.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {analysis.riskAssessment.level} Risk
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Contributing Factors:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {analysis.riskAssessment.factors.map((factor, index) => (
                  <li key={index} className="ml-4">{factor}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</h4>
              <ul className="space-y-2">
                {analysis.recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Legal Considerations</h4>
              <ul className="space-y-2">
                {analysis.legalConsiderations.map((consideration, index) => (
                  <li key={index} className="flex items-start">
                    <Shield className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              This is an auto-generated report. For official documentation, please contact the appropriate authorities.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Report ID: {incident.id} | Generated by Safety Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

function IncidentReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  
  const reportRef = React.useRef();

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Incident-Report-${id}`,
  });

  // Handle download as PDF
  const handleDownload = () => {
    // In a real app, this would generate a PDF
    // For now, we'll just trigger the print dialog
    handlePrint();
  };

  // Share functionality (for mobile)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Incident Report - ${id}`,
          text: `Please find attached the incident report for ${incident.type} that occurred on ${new Date(incident.timestamp?.toDate()).toLocaleDateString()}.`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // Fetch incident data
  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const docRef = doc(db, 'incidents', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setIncident(data);
          // Generate AI analysis
          setAnalysis(generateAIAnalysis(data));
        } else {
          setError('Incident not found');
        }
      } catch (err) {
        console.error('Error fetching incident:', err);
        setError('Failed to load incident data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIncident();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incident report...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading report</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The requested incident could not be found.'}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to Incidents
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Incident Report
            </h1>
            <div className="ml-auto flex space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                title="Download PDF"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                title="Print"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <PrintableReport 
            ref={reportRef} 
            incident={incident} 
            analysis={analysis} 
            currentUser={currentUser} 
          />
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
              onClick={() => navigate('/sos')}
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs mt-1">SOS</span>
            </button>
            <button
              onClick={() => navigate('/incident')}
              className="flex flex-col items-center justify-center py-3 px-4 text-indigo-600"
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

export default IncidentReport;
