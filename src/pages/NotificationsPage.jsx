import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Trash2, Check, X, Loader2, AlertTriangle, Calendar, Heart, Package, AlertCircle } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import notificationService from '../services/notificationService'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch notifications from Firebase
  useEffect(() => {
    console.log('🔔 [NotificationsPage] Fetching notifications...')
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('📋 [NotificationsPage] Calling notificationService.getNotifications()')
      const fetchedNotifications = await notificationService.getNotifications()
      
      console.log(`✅ [NotificationsPage] Received ${fetchedNotifications.length} notifications`)
      setNotifications(fetchedNotifications)
    } catch (err) {
      console.error('❌ [NotificationsPage] Error fetching notifications:', err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      console.log(`📝 [NotificationsPage] Marking notification ${id} as read`)
      const result = await notificationService.markAsRead(id)
      
      if (result.success) {
        setNotifications(notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ))
        console.log('✅ [NotificationsPage] Notification marked as read')
      }
    } catch (err) {
      console.error('❌ [NotificationsPage] Error marking as read:', err)
      alert('Failed to mark as read. Please try again.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      console.log('📝 [NotificationsPage] Marking all notifications as read')
      const result = await notificationService.markAllAsRead()
      
      if (result.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })))
        console.log('✅ [NotificationsPage] All notifications marked as read')
      }
    } catch (err) {
      console.error('❌ [NotificationsPage] Error marking all as read:', err)
      alert('Failed to mark all as read. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      console.log(`🗑️ [NotificationsPage] Deleting notification ${id}`)
      const result = await notificationService.deleteNotification(id)
      
      if (result.success) {
        setNotifications(notifications.filter(notif => notif.id !== id))
        console.log('✅ [NotificationsPage] Notification deleted')
      }
    } catch (err) {
      console.error('❌ [NotificationsPage] Error deleting notification:', err)
      alert('Failed to delete notification. Please try again.')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) {
      return
    }

    try {
      console.log('🗑️ [NotificationsPage] Clearing all notifications')
      const result = await notificationService.clearAll()
      
      if (result.success) {
        setNotifications([])
        console.log('✅ [NotificationsPage] All notifications cleared')
      }
    } catch (err) {
      console.error('❌ [NotificationsPage] Error clearing all:', err)
      alert('Failed to clear notifications. Please try again.')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Map notification categories to icons
  const getCategoryIcon = (category) => {
    const iconClass = "w-5 h-5"
    switch (category) {
      case 'events':
        return <Calendar className={iconClass} />
      case 'health':
        return <Heart className={iconClass} />
      case 'food_aid':
        return <Package className={iconClass} />
      case 'emergency':
        return <AlertTriangle className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const getTypeColor = (type, category) => {
    // Use category if available, fallback to type
    const notifType = category || type
    
    if (isDarkMode) {
      switch (notifType) {
        case 'emergency':
        case 'error':
          return 'bg-red-900/50 border-red-800 text-red-300'
        case 'events':
          return 'bg-purple-900/50 border-purple-800 text-purple-300'
        case 'health':
          return 'bg-blue-900/50 border-blue-800 text-blue-300'
        case 'food_aid':
          return 'bg-green-900/50 border-green-800 text-green-300'
        case 'warning':
          return 'bg-orange-900/50 border-orange-800 text-orange-300'
        case 'success':
          return 'bg-emerald-900/50 border-emerald-800 text-emerald-300'
        case 'info':
        default:
          return 'bg-gray-700/50 border-gray-600 text-gray-300'
      }
    } else {
      switch (notifType) {
        case 'emergency':
        case 'error':
          return 'bg-red-50 border-red-200 text-red-700'
        case 'events':
          return 'bg-purple-50 border-purple-200 text-purple-700'
        case 'health':
          return 'bg-blue-50 border-blue-200 text-blue-700'
        case 'food_aid':
          return 'bg-green-50 border-green-200 text-green-700'
        case 'warning':
          return 'bg-orange-50 border-orange-200 text-orange-700'
        case 'success':
          return 'bg-emerald-50 border-emerald-200 text-emerald-700'
        case 'info':
        default:
          return 'bg-gray-50 border-gray-200 text-gray-700'
      }
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-gray-950/90 via-slate-900/90 to-gray-900/90' : 'from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`}></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 backdrop-blur-sm rounded-lg transition ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 hover:bg-white/30'}`}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {!isLoading && unreadCount > 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-200'}`}>{unreadCount} unread</p>
            )}
          </div>
          <div className="w-10" />
        </div>

        {/* Error State */}
        {error && (
          <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-red-950/50 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start space-x-3">
              <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                  {error}
                </p>
                <button
                  onClick={fetchNotifications}
                  className={`text-sm font-semibold mt-2 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-700 hover:text-red-800'}`}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={`backdrop-blur-lg rounded-xl shadow-xl p-12 text-center ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
            <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading notifications...
            </p>
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            {notifications.length > 0 && (
              <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
                <div className="flex items-center justify-between space-x-3">
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className={`flex items-center space-x-2 text-sm font-medium transition ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300 disabled:text-gray-600' 
                        : 'text-blue-600 hover:text-blue-700 disabled:text-gray-400'
                    } disabled:cursor-not-allowed`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark all read</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className={`flex items-center space-x-2 text-sm font-medium transition ${
                      isDarkMode 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className={`backdrop-blur-lg rounded-xl shadow-xl p-12 text-center ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
                  <Bell className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>No Notifications</h3>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'} ${
                      !notification.read ? `ring-2 ${isDarkMode ? 'ring-blue-500' : 'ring-blue-400'}` : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getTypeColor(notification.type, notification.category)} flex items-center justify-center border`}>
                        {getCategoryIcon(notification.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : 'Notification'}
                          </h4>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></span>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`flex items-center space-x-1 text-sm font-medium transition ${
                            isDarkMode 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark as read</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className={`flex items-center space-x-1 text-sm font-medium transition ml-auto ${
                          isDarkMode 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-red-600 hover:text-red-700'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
