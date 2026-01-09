import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SafetyMap from './pages/SafetyMap';
import SOSPage from './pages/SOSPage';
import IncidentLog from './pages/IncidentLog';
import IncidentReport from './pages/IncidentReport';
import NotFound from './pages/NotFound';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/map"
              element={
                <PrivateRoute>
                  <SafetyMap />
                </PrivateRoute>
              }
            />
            <Route
              path="/sos"
              element={
                <PrivateRoute>
                  <SOSPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident"
              element={
                <PrivateRoute>
                  <IncidentLog />
                </PrivateRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <PrivateRoute>
                  <IncidentReport />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
