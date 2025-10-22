import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [stats, setStats] = useState([])

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

  return (
    <Layout title="Dashboard">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Doc. 3.0', value: 8785 },
          { label: 'Total Doc. 3.3', value: 11527 },
          { label: 'Total Doc. 2.3', value: 1675 },
          { label: 'Total Doc. 2.6', value: 0 },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200">{item.value.toLocaleString()}</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs lg:text-sm">{item.label}</div>
            <button className="text-blue-600 text-xs lg:text-sm mt-2 hover:underline">
              Lihat Detail →
            </button>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-base lg:text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Year to Date Summary</h2>
        <div className="w-full h-48 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} layout="vertical" margin={{ left: 20, right: 20 }}>
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
    </Layout>
  )
}
