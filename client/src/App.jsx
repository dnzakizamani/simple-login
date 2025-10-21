import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'



function Protected({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/auth/me', {
          withCredentials: true, // penting supaya cookie dikirim
        })
        console.log('Auth response:', res.data)
        if (res.data.ok) {
          setIsAuth(true)
        } else {
          setIsAuth(false)
        }
      } catch (err) {
        console.error('Auth check failed:', err?.response?.data)
        setIsAuth(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="text-center mt-10 text-white">Checking authentication...</div>
  }

  if (!isAuth) {
    console.log('Not authenticated, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  console.log('Authenticated, showing protected page')
  return children
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
