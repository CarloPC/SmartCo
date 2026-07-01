import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle, Bell, Loader2, Calendar, Heart, Package, AlertTriangle, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import notificationService from '../services/notificationService'

const getNotificationPath = (notification) => {
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
      return '/emergency/report'
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
      return <AlertTriangle className={`${cls} text-red-500`} />
    default:
      return <AlertCircle className={`${cls} text-gray-400`} />
  }
}

const NotificationDropdown = ({ onClose, onNotificationRead }) => {
  const navigate = useNavigate()
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
      // Get only the latest 3 notifications
      setNotifications(fetchedNotifications.slice(0, 3))
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
    navigate(getNotificationPath(notification))
  }

  return (
    <div className={`${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-b shadow-lg p-4 space-y-2`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Notifications
        </h3>
        <button onClick={onClose} className={`${
          isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
        } transition`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${
            isDarkMode ? 'text-blue-400' : 'text-blue-500'
          }`} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className={`w-12 h-12 mx-auto mb-2 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No notifications
          </p>
        </div>
      ) : (
        <>
          {notifications.map(notification => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left p-3 rounded-lg text-sm transition group ${
                !notification.read 
                  ? isDarkMode 
                    ? 'bg-blue-950/50 border border-blue-800/50 hover:bg-blue-900/60' 
                    : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                  : isDarkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-700/60' 
                    : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start space-x-2">
                {getCategoryIcon(notification.category, notification.type)}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 mt-0.5 opacity-0 group-hover:opacity-100 transition ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
              </div>
            </button>
          ))}
          
          <button
            onClick={handleViewAll}
            className={`w-full text-center py-2 rounded-lg font-medium text-sm transition ${
              isDarkMode 
                ? 'text-blue-400 hover:bg-blue-950/30' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            View All Notifications
          </button>
        </>
      )}
    </div>
  )
}

export default NotificationDropdown
