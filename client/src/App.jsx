import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Permissions from './pages/Permissions'
import Menus from './pages/Menus'
import Books from './pages/Books'
import BookReviews from './pages/BookReviews'
import MyReviews from './pages/MyReviews'
import BookDetail from './pages/BookDetail'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Transactions from './pages/Transactions'
import CrudGenerator from './pages/CrudGenerator'



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
      <Route path="/users" element={<Protected><Users /></Protected>} />
      <Route path="/roles" element={<Protected><Roles /></Protected>} />
      <Route path="/permissions" element={<Protected><Permissions /></Protected>} />
      <Route path="/menus" element={<Protected><Menus /></Protected>} />
      <Route path="/books" element={<Protected><Books /></Protected>} />
      <Route path="/books/:id" element={<Protected><BookDetail /></Protected>} />
      <Route path="/book-reviews" element={<Protected><BookReviews /></Protected>} />
      <Route path="/my-reviews" element={<Protected><MyReviews /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/crud-generator" element={<Protected><CrudGenerator /></Protected>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
