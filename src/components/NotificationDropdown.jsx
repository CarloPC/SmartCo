import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle, Bell, Loader2, Calendar, Heart, Package, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import notificationService from '../services/notificationService'

const isOfficial = (user) => user?.role === 'admin' || user?.role === 'barangay_official'
// AdminRoute additionally lets 'bhw' reach /emergency, so the notification
// link needs its own check here rather than reusing isOfficial() (which is
// also used by the unrelated document-notification routing above/below).
const canManageEmergencies = (user) =>
  user?.role === 'admin' || user?.role === 'barangay_official' || user?.role === 'bhw'

const getNotificationPath = (notification, user) => {
  const category = notification.category || notification.type
  switch (category) {
    case 'events':
      return '/events'
    case 'health':
      return '/health'
    case 'food_aid':
    case 'foodaid':
      return '/food-aid'
    case 'emergency':
      return canManageEmergencies(user) ? '/emergency' : '/emergency/report'
    case 'document':
      return isOfficial(user) ? '/documents/manage' : '/documents'
    case 'community':
    default:
      return '/home'
  }
}

const getCategoryIcon = (category, type) => {
  const notifType = category || type
  const cls = "w-4 h-4 flex-shrink-0 mt-0.5"
  switch (notifType) {
    case 'events':
      return <Calendar className={`${cls} text-purple-500`} />
    case 'health':
      return <Heart className={`${cls} text-blue-500`} />
    case 'food_aid':
    case 'foodaid':
      return <Package className={`${cls} text-green-500`} />
    case 'emergency':
      return <AlertTriangle className={`${cls} text-red-400 animate-pulse`} />
    case 'document':
      return <FileText className={`${cls} text-blue-500`} />
    default:
      return <AlertCircle className={`${cls} text-gray-400`} />
  }
}

const NotificationDropdown = ({ onClose, onNotificationRead }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const fetchedNotifications = await notificationService.getNotifications()
      // Emergency notifications are high priority — always surface them
      // first, then fall back to the existing recency ordering.
      const sorted = [...fetchedNotifications].sort((a, b) => {
        const aEmergency = (a.category || a.type) === 'emergency' ? 1 : 0
        const bEmergency = (b.category || b.type) === 'emergency' ? 1 : 0
        if (aEmergency !== bEmergency) return bEmergency - aEmergency
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      // Get only the latest 3 notifications (post-sort)
      setNotifications(sorted.slice(0, 3))
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleViewAll = () => {
    onClose()
    navigate('/notifications')
  }

  const handleNotificationClick = async (notification) => {
    // Mark as read and update UI immediately
    if (!notification.read) {
      const result = await notificationService.markAsRead(notification.id)
      if (result.success) {
        setNotifications((prev) => prev.map((notif) =>
          notif.id === notification.id ? { ...notif, read: true } : notif
        ))
        if (onNotificationRead) {
          onNotificationRead()
        }
        window.dispatchEvent(new Event('notifications-updated'))
      }
    }
    onClose()
    navigate(getNotificationPath(notification, user))
  }

  return (
    <div className="relative rounded-2xl border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,.35)] overflow-hidden bg-gradient-to-br from-slate-900/80 via-indigo-900/60 to-blue-950/70">
      {/* ambient glow accents, matches Topbar style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-[70px]" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 p-4 space-y-2">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
          <h3 className="font-semibold text-white">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-300" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-2 text-white/20" />
            <p className="text-sm text-white/50">No notifications</p>
          </div>
        ) : (
          <>
            {notifications.map(notification => {
              const isEmergency = (notification.category || notification.type) === 'emergency'
              return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 group border ${
                  isEmergency
                    ? 'bg-red-500/10 border-red-400/40 hover:bg-red-500/20 hover:border-red-400/60 shadow-[0_0_20px_rgba(248,113,113,0.15)]'
                    : !notification.read
                      ? 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 hover:border-blue-400/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {getCategoryIcon(notification.category, notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white/90">
                      {notification.message}
                    </p>
                    <p className="text-xs mt-1 text-white/40">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {!notification.read && (
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${
                        isEmergency
                          ? 'bg-red-400 animate-pulse shadow-[0_0_6px_rgba(248,113,113,.9)]'
                          : 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,.8)]'
                      }`}></span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 opacity-0 group-hover:opacity-100 transition text-white/50" />
                  </div>
                </div>
              </button>
              )
            })}

            <button
              onClick={handleViewAll}
              className="w-full text-center py-2 rounded-xl font-medium text-sm text-blue-300 hover:bg-white/10 hover:text-blue-200 transition-all duration-200"
            >
              View All Notifications
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationDropdown