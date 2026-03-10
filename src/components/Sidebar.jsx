import { Link, useLocation } from 'react-router-dom'
import { Home, Heart, Package, Calendar, Shield, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const isAdmin = adminService.isAdmin(user)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Heart, label: 'Health', path: '/health' },
    { icon: Package, label: 'Food Aid', path: '/food-aid' },
    { icon: Calendar, label: 'Events', path: '/events' },
    {
      icon: AlertTriangle,
      label: isAdmin ? 'Emergencies' : 'Report Emergency',
      path: isAdmin ? '/emergency' : '/emergency/report',
      accent: true,
    },
  ]

  if (isAdmin) {
    navItems.push({ icon: Shield, label: 'Admin', path: '/admin' })
  }

  return (
    <aside
      style={{ width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)', top: 'var(--topbar-height)' }}
      className={`hidden lg:flex flex-col fixed left-0 bottom-0 z-30 transition-all duration-300 ease-in-out ${
        isDarkMode
          ? 'bg-gray-900/95 border-gray-700/60'
          : 'bg-white/90 border-gray-200'
      } border-r backdrop-blur-xl shadow-xl`}
    >
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3 space-x-3'
                } ${
                  active
                    ? item.accent
                      ? isDarkMode ? 'bg-red-900/60 text-red-300' : 'bg-red-50 text-red-700'
                      : isDarkMode ? 'bg-blue-900/70 text-blue-300' : 'bg-blue-50 text-blue-700'
                    : item.accent
                      ? isDarkMode ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${item.accent ? 'bg-red-600' : 'bg-blue-600'}`} />
                )}
                <item.icon
                  className={`flex-shrink-0 w-5 h-5 transition-colors ${
                    active
                      ? item.accent ? (isDarkMode ? 'text-red-400' : 'text-red-600') : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                      : item.accent ? (isDarkMode ? 'text-red-400' : 'text-red-500') : ''
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}

                {/* Tooltip on collapsed */}
                {isCollapsed && (
                  <div className={`absolute left-full ml-3 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg ${
                    isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-900 text-white'
                  }`}>
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className={`p-2 border-t ${isDarkMode ? 'border-gray-700/60' : 'border-gray-200'}`}>
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center justify-center rounded-xl py-2.5 transition ${
            isDarkMode
              ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center space-x-2 text-sm font-medium">
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
