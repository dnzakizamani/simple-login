import React from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {darkMode ? <FaSun /> : <FaMoon />}
    </button>
  )
}
