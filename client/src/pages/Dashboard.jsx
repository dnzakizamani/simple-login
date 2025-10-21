import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaUserCircle, FaHome, FaDatabase, FaFileInvoice, FaUsers, FaWalking, FaCog } from 'react-icons/fa'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    axios.get('http://localhost:4000/api/auth/me', { withCredentials: true })
      .then(res => { if (mounted) setUser(res.data.user) })
      .catch(() => { navigate('/login') })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // contoh data dummy, nanti bisa diganti API
    setStats([
      { month: '2024-10', Final: 1015, Draft: 50 },
      { month: '2024-11', Final: 796, Draft: 20 },
      { month: '2024-12', Final: 702, Draft: 40 },
      { month: '2025-01', Final: 833, Draft: 35 },
      { month: '2025-02', Final: 983, Draft: 60 },
    ])
  }, [])

  const logout = async () => {
    await axios.post('http://localhost:4000/api/auth/logout', {}, { withCredentials: true })
    navigate('/login')
  }

  if (!user) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0D1B3D] text-white flex flex-col">
        <div className="flex justify-center items-center py-4 border-b border-white/10">
          <img src="/logo3.png" alt="Logo" className="w-36" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <MenuItem icon={<FaHome />} label="Home" active />
          <MenuItem icon={<FaDatabase />} label="Master Data" />
          <MenuItem icon={<FaUsers />} label="Visitor Management" />
          <MenuItem icon={<FaWalking />} label="Patrol Management" />
          <MenuItem icon={<FaCog />} label="Pengaturan" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="flex items-center justify-between bg-white shadow px-6 py-3">
          <div className="text-gray-600 text-sm">
            {new Date().toLocaleString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-semibold">{user.username || user.email}</span>
            <FaUserCircle className="text-2xl text-gray-600" />
            <button
              onClick={logout}
              className="ml-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-6 flex-1 overflow-y-auto">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Doc. 3.0', value: 8785 },
              { label: 'Total Doc. 3.3', value: 11527 },
              { label: 'Total Doc. 2.3', value: 1675 },
              { label: 'Total Doc. 2.6', value: 0 },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
                <div className="text-gray-500 text-sm">{item.label}</div>
                <button className="text-blue-600 text-sm mt-2 hover:underline">
                  Lihat Detail →
                </button>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Year to Date Summary</h2>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ left: 30 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="month" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Final" fill="#3B82F6" />
                  <Bar dataKey="Draft" fill="#A3E635" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition ${
        active ? 'bg-white/20' : 'hover:bg-white/10'
      }`}
    >
      <div className="text-lg">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
