import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import NotificationDropdown from './NotificationDropdown'
import notificationService from '../services/notificationService'

const Topbar = ({ onToggleSidebar, unreadCount, onOpenProfile, onNotificationRead }) => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleNotificationToggle = async () => {
  const opening = !showNotifications
  setShowNotifications(opening)

  if (opening && unreadCount > 0) {
    await notificationService.markAllAsRead()
    if (onNotificationRead) onNotificationRead()
    window.dispatchEvent(new Event('notifications-updated'))
  }
}

  return (
   <header
      style={{ height: 'var(--topbar-height)' }}
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6
        border-b backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,.15)] transition-all duration-500
        ${isDarkMode
          ? 'bg-gradient-to-r from-slate-900/70 via-indigo-900/55 to-blue-950/65 border-white/10'
          : 'bg-gradient-to-r from-white/12 via-blue-500/12 to-indigo-600/18 border-white/10'
        }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-2xl">
        <div className="absolute -top-16 left-1/4 h-40 w-40 rounded-full bg-cyan-400/10 blur-[90px]" />
        <div className="absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

     {/* Left: Hamburger + Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 text-white/60 hover:bg-white/10 hover:backdrop-blur-xl hover:text-white"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

       <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 text-left group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-blue-500/30 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105">
            S
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white">SmartCo</div>
            <div className="text-[11px] font-medium text-white/50 leading-none mt-0.5">Barangay Platform</div>
          </div>
        </button>
      </div>

     {/* Right: Notifications + Profile */}
      <div className="relative z-10 flex items-center gap-2">
        <button
          onClick={handleNotificationToggle}
          className="relative p-2 rounded-xl transition-all duration-300 text-white/60 hover:bg-white/10 hover:backdrop-blur-xl hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1 ring-2 ring-black/20 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:shadow-lg"
          title="Profile"
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </button>

        {showNotifications && (
          <div className="absolute top-full right-0 mt-2 w-80 shadow-2xl rounded-xl overflow-hidden z-50">
            <NotificationDropdown onClose={() => setShowNotifications(false)} onNotificationRead={onNotificationRead} />
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar