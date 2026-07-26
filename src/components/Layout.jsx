
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

  // Pages that render their own full-bleed background (image + gradient blobs)
  // need Layout's own wrapper to stay transparent, or Layout's neutral bg
  // paints over them due to z-index stacking.
  const hasCustomBackground = location.pathname === '/home' || location.pathname === '/bhw' || location.pathname === '/health' || location.pathname === '/food-aid' || location.pathname === '/events' || location.pathname === '/events/create' || location.pathname === '/emergency' || location.pathname === '/emergency/report' || location.pathname === '/admin'
  || location.pathname === '/admin/users' || location.pathname === '/admin/notifications' || location.pathname === '/admin/announcements' || location.pathname === '/admin/requests' || location.pathname === '/admin/role-requests' || location.pathname === '/admin/approvals' || location.pathname === '/profilesidebar' || location.pathname === '/profile' || location.pathname === '/notifications' || location.pathname === '/settings' || location.pathname === '/privacy-security' || location.pathname === '/request-admin' || location.pathname === '/request-role-upgrade' || location.pathname === '/help-support' || location.pathname === '/about'
  || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/welcome' || location.pathname === '/health/records' || location.pathname === '/health/records/:id' || location.pathname === '/health/records/:id/edit' || location.pathname === '/health/records/create' || location.pathname === '/food-aid/requests' || location.pathname === '/food-aid/requests/:id' || location.pathname === '/food-aid/requests/:id/edit' || location.pathname === '/food-aid/requests/create'
  || location.pathname === '/record-checkup' || location.pathname === '/my-assignments' || location.pathname === '/food-aid/my-assignments' || location.pathname === '/food-aid/optimize-schedule' || location.pathname === '/food-aid/optimize-schedule/:id' || location.pathname === '/food-aid/optimize-schedule/:id/edit' || location.pathname === '/ai-insights' || location.pathname === '/ai-insights/:id' || location.pathname === '/ai-insights/:id/edit' || location.pathname === '/ai-insights/create' || location.pathname === '/food-aid/optimize'
  || location.pathname === '/document' || location.pathname === '/documents' || location.pathname === '/documents/manage' || location.pathname === '/documents/:id/edit' || location.pathname === '/documents/create' || location.pathname === '/emergency/report' || location.pathname === '/emergency/report/:id' || location.pathname === '/emergency/report/:id/edit' || location.pathname === '/emergency/report/create' || location.pathname === '/documents/new'
  useEffect(() => { 
    fetchUnreadCount()  
    const interval = setInterval(fetchUnreadCount, 30000)
    window.addEventListener('notifications-updated', fetchUnreadCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', fetchUnreadCount)
    }
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleNotificationRead = async () => { await fetchUnreadCount() }
  const handleToggleSidebar = () => { setIsSidebarCollapsed((prev) => !prev) }

  const sidebarOffset = isSidebarCollapsed
    ? 'lg:ml-[var(--sidebar-collapsed-width)]'
    : 'lg:ml-[var(--sidebar-width)]'

  return (
    /*
     * Root shell:
     *  - On pages with their own hero background (home, health): transparent
     *    so that page's fixed gradient/image shows through
     *  - Everywhere else: neutral bg as before
     */
    <div className={`min-h-screen ${
      hasCustomBackground
        ? 'bg-transparent'
        : isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
    }`}>

      {/* Global gradient ” only rendered on pages with their own hero background */}
      {hasCustomBackground && (
        <>
          <div className={`fixed inset-0 -z-10 ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800'
          }`} />
          {/* Decorative blobs */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />
          </div>
        </>
      )}

      <ProfileSidebar isOpen={showProfileSidebar} onClose={() => setShowProfileSidebar(false)} />

      <Topbar
        onToggleSidebar={handleToggleSidebar}
        unreadCount={unreadCount}
        onOpenProfile={() => setShowProfileSidebar(true)}
        onNotificationRead={handleNotificationRead}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      {/* Main content ” transparent on pages with their own hero background so it bleeds through */}
      <main
        style={{ paddingTop: 'var(--topbar-height)' }}
        className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarOffset} ${
          hasCustomBackground ? 'bg-transparent' : ''
        }`}
      >
        <div className="pb-[var(--bottom-nav-height)] lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t shadow-lg ${
          hasCustomBackground
            ? 'border-white/15 bg-white/10 backdrop-blur-xl'
            : isDarkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
        }`}
        style={{ height: 'var(--bottom-nav-height)' }}
      >
        <div className={`flex items-center ${adminService.isAdmin(user) ? 'justify-between' : 'justify-around'} h-full px-2`}>
          {[
            { to: '/home',     Icon: Home,          label: 'Home',      match: '/home' },
            { to: '/health',   Icon: Heart,         label: 'Health',    match: '/health' },
            { to: '/food-aid', Icon: Package,       label: 'Food Aid',  match: '/food-aid' },
            { to: '/events',   Icon: Calendar,      label: 'Events',    match: '/events' },
            { to: adminService.isAdmin(user) ? '/emergency' : '/emergency/report',
                               Icon: AlertTriangle, label: 'Emergency', match: '/emergency', accent: true },
          ].map(({ to, Icon, label, match, accent }) => {
            const active = location.pathname.startsWith(match)
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition ${
                  hasCustomBackground
                    ? active
                      ? 'text-white'
                      : 'text-white/50 hover:text-white'
                    : active
                      ? accent
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
          {adminService.isAdmin(user) && (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition ${
                hasCustomBackground
                  ? location.pathname.startsWith('/admin') ? 'text-white' : 'text-white/50 hover:text-white'
                  : location.pathname.startsWith('/admin')
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
