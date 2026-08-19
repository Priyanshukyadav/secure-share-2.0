import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth } from './services/api';

const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SharedFile = lazy(() => import('./pages/SharedFile'));

function App() {
  useEffect(() => {
    // Initialize authentication from localStorage
    initializeAuth();
  }, []);

  return (
    <Router>
      <Suspense fallback={<div className="loader">Loading...</div>}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shared/:token" element={<SharedFile />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
