import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Heart, Package, Bell, X, AlertCircle, Shield } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import ProfileSidebar from './ProfileSidebar'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import notificationService from '../services/notificationService'

const Layout = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const isActive = (path) => location.pathname === path

  // Fetch unread count
  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications)
    // Refresh unread count when closing dropdown
    if (showNotifications) {
      fetchUnreadCount()
    }
  }

  return (
    <div className={`max-w-md mx-auto ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col`}>
      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfileSidebar} 
        onClose={() => setShowProfileSidebar(false)} 
      />

      {/* Header */}
      <div className={`${
        isDarkMode ? 'bg-gradient-to-r from-blue-900 to-slate-900' : 'bg-gradient-to-r from-blue-600 to-blue-700'
      } text-white p-4 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowProfileSidebar(true)}
              className={`w-10 h-10 ${
                isDarkMode ? 'bg-blue-800' : 'bg-white'
              } rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200`}
            >
              <span className={`${isDarkMode ? 'text-blue-200' : 'text-blue-600'} font-bold text-lg`}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            <div>
              <h1 className="font-bold text-lg">SmartCo</h1>
              <p className={`text-xs ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>Barangay Management</p>
            </div>
          </div>
          <button 
            onClick={handleNotificationToggle}
            className={`relative p-2 ${
              isDarkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-500'
            } rounded-lg transition`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 ${
                isDarkMode ? 'border-blue-900' : 'border-blue-600'
              } flex items-center justify-center text-white text-[10px] font-bold px-1`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <NotificationDropdown onClose={() => setShowNotifications(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <div className={`${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      } border-t shadow-lg fixed bottom-0 left-0 right-0 max-w-md mx-auto`}>
        <div className={`flex items-center ${adminService.isAdmin(user) ? 'justify-between' : 'justify-around'} py-3 px-2`}>
          <Link
            to="/home"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
              isActive('/home') 
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600' 
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            to="/health"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
              isActive('/health') 
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600' 
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs font-medium">Health</span>
          </Link>
          <Link
            to="/food-aid"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
              isActive('/food-aid') 
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600' 
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs font-medium">Food Aid</span>
          </Link>
          <Link
            to="/events"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
              isActive('/events') 
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600' 
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Events</span>
          </Link>
          {adminService.isAdmin(user) && (
            <Link
              to="/admin"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                location.pathname.startsWith('/admin')
                  ? isDarkMode ? 'text-purple-400' : 'text-purple-600' 
                  : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-6 h-6" />
              <span className="text-xs font-medium">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Layout
