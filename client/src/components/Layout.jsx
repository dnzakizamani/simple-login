import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import * as FaIcons from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'

export default function Layout({ children, title }) {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menus, setMenus] = useState([])
  const [expandedMenus, setExpandedMenus] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    axios.get('http://localhost:4000/api/auth/me', { withCredentials: true })
      .then(res => { if (mounted) setUser(res.data.user) })
      .catch(() => { navigate('/login') })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAccessibleMenus()
    }
  }, [user])

  const fetchAccessibleMenus = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/menus', { withCredentials: true })
      // Filter menus based on user permissions
      const userPermissions = user.roles?.flatMap(role => role.permissions || []) || []
      const accessibleMenus = res.data.menus.filter(menu => {
        if (!menu.permission_ids || menu.permission_ids.length === 0) return true
        return menu.permission_ids.some(permId => userPermissions.some(up => up.id === permId))
      })
      setMenus(accessibleMenus)
    } catch (err) {
      console.error('Failed to fetch menus:', err)
    }
  }

  const logout = async () => {
    await axios.post('http://localhost:4000/api/auth/logout', {}, { withCredentials: true })
    navigate('/login')
  }

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }))
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1B3D] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center py-4 px-4 border-b border-white/10">
          <img src="/logo3.png" alt="Logo" className="w-24 lg:w-36" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <FaIcons.FaTimes />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menus
            .filter(menu => !menu.parent_id) // Only parent menus
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(menu => (
              <CollapsibleMenuItem
                key={menu.id}
                menu={menu}
                allMenus={menus}
                activePath={window.location.pathname}
                isExpanded={expandedMenus[menu.id]}
                onToggle={() => toggleMenu(menu.id)}
              />
            ))}
        </nav>
      </aside>

      {/* OVERLAY for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow px-4 lg:px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <FaIcons.FaBars />
            </button>
            <div className="text-gray-600 dark:text-gray-300 text-xs lg:text-sm">
              {new Date().toLocaleString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            <ThemeToggle />
            <span className="font-semibold text-sm lg:text-base text-gray-800 dark:text-gray-200">{user.username || user.email}</span>
            <FaIcons.FaUserCircle className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300" />
            <button
              onClick={logout}
              className="ml-2 lg:ml-3 px-2 lg:px-3 py-1 bg-red-500 text-white text-xs lg:text-sm rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 lg:p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

function CollapsibleMenuItem({ menu, allMenus, activePath, isExpanded, onToggle }) {
  const navigate = useNavigate()
  const IconComponent = getIconComponent(menu.icon)
  const subMenus = allMenus.filter(m => m.parent_id === menu.id).sort((a, b) => a.sort_order - b.sort_order)
  const hasSubMenus = subMenus.length > 0

  const handleClick = () => {
    if (hasSubMenus) {
      onToggle()
    } else if (menu.path) {
      navigate(menu.path)
    }
  }

  const isActive = activePath === menu.path || subMenus.some(sub => activePath === sub.path)

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded cursor-pointer transition ${
          isActive ? 'bg-white/20' : 'hover:bg-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg"><IconComponent /></div>
          <span className="text-sm font-medium">{menu.name}</span>
        </div>
        {hasSubMenus && (
          <FaIcons.FaChevronRight
            className={`text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        )}
      </div>

      {hasSubMenus && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {subMenus.map(subMenu => {
            const SubIconComponent = getIconComponent(subMenu.icon)
            return (
              <div
                key={subMenu.id}
                onClick={() => navigate(subMenu.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition ${
                  activePath === subMenu.path ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <div className="text-lg"><SubIconComponent /></div>
                <span className="text-sm font-medium">{subMenu.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getIconComponent(iconName) {
  if (!iconName) return FaIcons.FaHome

  // If it's a direct icon name like "FaHome", return it from FaIcons
  const Icon = FaIcons[iconName]
  return Icon || FaIcons.FaHome
}
