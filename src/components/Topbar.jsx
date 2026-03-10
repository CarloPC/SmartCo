import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import NotificationDropdown from './NotificationDropdown'

const Topbar = ({ onToggleSidebar, unreadCount, onOpenProfile }) => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleNotificationToggle = () => {
    setShowNotifications((prev) => !prev)
  }

  return (
    <header
      style={{ height: 'var(--topbar-height)' }}
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 shadow-lg ${
        isDarkMode
          ? 'bg-gradient-to-r from-blue-950 to-slate-900 border-b border-gray-700/50'
          : 'bg-gradient-to-r from-blue-600 to-indigo-700'
      }`}
    >
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center space-x-3">
        {/* Hamburger - visible on desktop only to toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className={`hidden lg:flex items-center justify-center w-9 h-9 rounded-lg transition ${
            isDarkMode ? 'hover:bg-blue-900/60' : 'hover:bg-blue-500/50'
          } text-white`}
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center space-x-2.5"
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <div className="relative">
              <span className="text-blue-600 font-bold text-base leading-none">S</span>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
          </div>
          <div className="text-white">
            <div className="font-bold text-base leading-tight">SmartCo</div>
            <div className={`text-xs leading-tight ${isDarkMode ? 'text-blue-300' : 'text-blue-100'}`}>
              Barangay Management
            </div>
          </div>
        </button>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center space-x-2 relative">
        {/* Notification Bell */}
        <button
          onClick={handleNotificationToggle}
          className={`relative p-2 rounded-lg transition text-white ${
            isDarkMode ? 'hover:bg-blue-900/60' : 'hover:bg-blue-500/50'
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className={`absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border-2 ${
              isDarkMode ? 'border-blue-950' : 'border-blue-600'
            } flex items-center justify-center text-white text-[9px] font-bold px-0.5`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition shadow-md ${
            isDarkMode
              ? 'bg-blue-800 text-blue-100 hover:bg-blue-700'
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
          title="Profile"
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute top-full right-0 mt-2 w-80 shadow-2xl rounded-xl overflow-hidden z-50">
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar
