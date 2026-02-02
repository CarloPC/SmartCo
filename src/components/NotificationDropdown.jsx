import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle, Bell, Loader2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import notificationService from '../services/notificationService'

const NotificationDropdown = ({ onClose }) => {
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
            <div 
              key={notification.id} 
              className={`p-3 rounded-lg text-sm ${
                !notification.read 
                  ? isDarkMode 
                    ? 'bg-blue-950/50 border border-blue-800/50' 
                    : 'bg-blue-50 border border-blue-200'
                  : isDarkMode 
                    ? 'bg-gray-800/50' 
                    : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-2">
                {notification.type === 'emergency' && (
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
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
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                )}
              </div>
            </div>
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
