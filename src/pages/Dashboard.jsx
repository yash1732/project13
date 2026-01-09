import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Shield, 
  FileText, 
  LogOut,
  ChevronRight,
  AlertCircle,
  Map,
  AlertOctagon,
  FileCheck
} from 'lucide-react';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for quick stats
  const quickStats = [
    { name: 'Active Shifts', value: '1', icon: Clock, color: 'text-blue-500 bg-blue-100' },
    { name: 'Incidents Logged', value: '0', icon: AlertTriangle, color: 'text-amber-500 bg-amber-100' },
    { name: 'Safe Zones', value: '3', icon: Shield, color: 'text-green-500 bg-green-100' },
  ];

  // Quick actions
  const quickActions = [
    {
      title: 'Check Route Safety',
      description: 'Analyze your route for potential risks',
      icon: Map,
      color: 'text-indigo-600 bg-indigo-100',
      path: '/map'
    },
    {
      title: 'Log Incident',
      description: 'Report safety concerns or incidents',
      icon: AlertOctagon,
      color: 'text-red-600 bg-red-100',
      path: '/incident'
    },
    {
      title: 'View Reports',
      description: 'Access your incident history',
      icon: FileCheck,
      color: 'text-purple-600 bg-purple-100',
      path: '/incident'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {currentUser?.email?.split('@')[0] || 'Rider'}
            </h1>
            <p className="text-sm text-gray-500">Stay safe on the road</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="h-4 w-4 mr-1" />
            {isLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {quickStats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {quickActions.map((action, index) => (
                <li key={index}>
                  <Link
                    to={action.path}
                    className="block hover:bg-gray-50"
                  >
                    <div className="flex items-center px-4 py-4 sm:px-6">
                      <div className={`flex-shrink-0 rounded-md p-3 ${action.color}`}>
                        <action.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex text-sm">
                            <p className="font-medium text-indigo-600 truncate">{action.title}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 truncate">{action.description}</p>
                        </div>
                        <div className="ml-5 flex-shrink-0">
                          <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Emergency Assistance</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Immediate help when you need it most
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Link
                to="/sos"
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Emergency SOS
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between">
            <Link
              to="/dashboard"
              className="flex flex-col items-center justify-center py-3 px-4 text-indigo-600"
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
            </Link>
            <Link
              to="/map"
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <Map className="h-6 w-6" />
              <span className="text-xs mt-1">Map</span>
            </Link>
            <Link
              to="/sos"
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs mt-1">SOS</span>
            </Link>
            <Link
              to="/incident"
              className="flex flex-col items-center justify-center py-3 px-4 text-gray-500 hover:text-indigo-600"
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs mt-1">Incidents</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Dashboard;
