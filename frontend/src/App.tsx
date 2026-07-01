import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StarTopology from './pages/StarTopology';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import './index.css';

// Global axios defaults
axios.defaults.withCredentials = true;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    axios.get('http://localhost:3001/api/auth/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div style={{
        height: '100vh', background: '#f3f3f3',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        {/* Spinner */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid rgba(200,241,53,0.20)',
          borderTopColor: '#c8f135',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: 14, fontWeight: 600, color: '#9ca3af', letterSpacing: '-0.2px',
        }}>
          Authenticating…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/star-topology" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="star-topology" element={<StarTopology />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
