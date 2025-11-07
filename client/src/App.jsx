import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Permissions from './pages/Permissions'
import Menus from './pages/Menus'
import PDFs from './pages/PDFs'
import PDFReader from './pages/PDFReader'
import Images from './pages/Images'
import Moodboards from './pages/Moodboards'
import MoodboardDetail from './pages/MoodboardDetail'
import FileConverter from './pages/FileConverter'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Transactions from './pages/Transactions'
import CrudGenerator from './pages/CrudGenerator'
import Layout from './components/Layout'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    console.log('Not authenticated, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  console.log('Authenticated, showing protected page')
  return children
}

function MainLayout() {
  return (
    <Protected>
      <Layout>
        <Outlet />
      </Layout>
    </Protected>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Route bersarang dengan layout permanen */}
      <Route element={
        <Protected>
          <Layout>
            <Outlet />
          </Layout>
        </Protected>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/menus" element={<Menus />} />
        <Route path="/pdfs" element={<PDFs />} />
        <Route path="/pdfs/:id/read" element={<PDFReader />} />
        <Route path="/images" element={<Images />} />
        <Route path="/moodboards" element={<Moodboards />} />
        <Route path="/moodboards/:id" element={<MoodboardDetail />} />
        <Route path="/converter" element={<FileConverter />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/products" element={<Products />} />
        <Route path="/crud-generator" element={<CrudGenerator />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}