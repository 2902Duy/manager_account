import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const handleLogin = (t) => {
    localStorage.setItem('token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect trang gốc */}
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

        {/* Auth pages — chỉ hiện khi chưa đăng nhập */}
        <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={!token ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected page */}
        <Route path="/dashboard" element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
