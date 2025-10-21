import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import p5 from 'p5'
import TRUNK from 'vanta/dist/vanta.trunk.min'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const vantaRef = useRef(null)
  const [vantaEffect, setVantaEffect] = useState(null)

  // 🌳 Tambahkan efek Vanta.TRUNK
  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        TRUNK({
          el: vantaRef.current,
          p5,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          spacing: 8.0,
          chaos: 3,
          backgroundColor: 0x07224a,
          color: 0xffffff,
        })
      )
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy()
    }
  }, [vantaEffect])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) return setError('Semua field wajib diisi.')

    try {
      setLoading(true)
      const res = await axios.post(
        'http://localhost:4000/api/auth/login',
        { identifier, password },
        { withCredentials: true }
      )
      if (res.data.ok) navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={vantaRef}
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
    >
      {/* Overlay agar konten di atas animasi */}
      <div className="absolute inset-0 bg-[#07224A]/70"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Logo" className="w-36" />
        </div>

        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-1">
          Selamat Datang
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Silahkan Masukkan Email dan Password Anda
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 text-sm font-medium">Email</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300">
              <FaUser className="text-gray-400 mr-2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan Email Anda"
                className="w-full p-2 outline-none text-gray-700"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-300">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password"
                className="w-full p-2 outline-none text-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="mr-2 accent-blue-600"
              />
              Remember
            </label>
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Lupa kata sandi Anda?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-[#0D1B3D] hover:bg-[#142857]'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
