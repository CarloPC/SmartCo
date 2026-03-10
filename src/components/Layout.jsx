import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Heart, Package, Shield, AlertTriangle } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ProfileSidebar from './ProfileSidebar'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import notificationService from '../services/notificationService'

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    fetchUnreadCount()
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

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  // Compute left offset for desktop main content
  const sidebarOffset = isSidebarCollapsed
    ? 'lg:ml-[var(--sidebar-collapsed-width)]'
    : 'lg:ml-[var(--sidebar-width)]'

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Profile Sidebar (slide-out panel) */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
      />

      {/* Fixed Top Bar */}
      <Topbar
        onToggleSidebar={handleToggleSidebar}
        unreadCount={unreadCount}
        onOpenProfile={() => setShowProfileSidebar(true)}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content */}
      <main
        style={{ paddingTop: 'var(--topbar-height)' }}
        className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarOffset}`}
      >
        {/* Page Content — bottom padding for mobile nav */}
        <div className="pb-[var(--bottom-nav-height)] lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      } border-t shadow-lg`} style={{ height: 'var(--bottom-nav-height)' }}>
        <div className={`flex items-center ${adminService.isAdmin(user) ? 'justify-between' : 'justify-around'} h-full px-2`}>
          <Link
            to="/home"
            className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
              isActive('/home')
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            to="/health"
            className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
              isActive('/health')
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Health</span>
          </Link>
          <Link
            to="/food-aid"
            className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
              isActive('/food-aid')
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium">Food Aid</span>
          </Link>
          <Link
            to="/events"
            className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
              isActive('/events')
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Events</span>
          </Link>
          <Link
            to={adminService.isAdmin(user) ? '/emergency' : '/emergency/report'}
            className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
              location.pathname.startsWith('/emergency')
                ? isDarkMode ? 'text-red-400' : 'text-red-600'
                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-medium">Emergency</span>
          </Link>
          {adminService.isAdmin(user) && (
            <Link
              to="/admin"
              className={`flex flex-col items-center space-y-0.5 px-3 py-2 rounded-lg transition ${
                location.pathname.startsWith('/admin')
                  ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}

export default Layout
