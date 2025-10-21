import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function Protected({ children }) {
  // Note: client checks auth by calling /api/auth/me in Dashboard effect.
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
