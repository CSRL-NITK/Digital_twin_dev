import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
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

  if (isAuthenticated === null) return <div className="h-screen bg-background text-text flex items-center justify-center">Authenticating...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
