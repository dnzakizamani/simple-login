/**
 * Main entry point for the React application
 * Developed by D.N. Zaki Zamani
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import ToastProvider from './components/ToastProvider'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
)
