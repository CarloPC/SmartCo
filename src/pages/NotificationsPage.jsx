import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Trash2, Check, X } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const NotificationsPage = () => {
  const navigate = useNavigate()
  
  // Mock notifications data - in real app, fetch from backend
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'emergency', 
      title: 'Medical Emergency Alert', 
      message: 'Emergency reported in Purok 4 - immediate response needed',
      time: '5 mins ago',
      read: false,
      icon: '🚨'
    },
    { 
      id: 2, 
      type: 'event', 
      title: 'Basketball Tournament Tomorrow', 
      message: 'Don\'t forget the community basketball tournament at 2 PM',
      time: '2 hours ago',
      read: false,
      icon: '🏀'
    },
    { 
      id: 3, 
      type: 'health', 
      title: 'Health Checkup Completed', 
      message: '15 senior citizens completed their monthly checkup',
      time: '5 hours ago',
      read: true,
      icon: '💊'
    },
    { 
      id: 4, 
      type: 'food', 
      title: 'Food Aid Distribution', 
      message: 'Purok 2 distribution scheduled for tomorrow at 9 AM',
      time: '1 day ago',
      read: true,
      icon: '🍱'
    },
  ])

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })))
  }

  const handleDelete = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id))
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([])
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getTypeColor = (type) => {
    switch (type) {
      case 'emergency': return 'bg-red-50 border-red-200 text-red-700'
      case 'event': return 'bg-purple-50 border-purple-200 text-purple-700'
      case 'health': return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'food': return 'bg-green-50 border-green-200 text-green-700'
      default: return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-200">{unreadCount} unread</p>
            )}
          </div>
          <div className="w-10" />
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-700"
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
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4 ${
                  !notification.read ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getTypeColor(notification.type)} flex items-center justify-center text-2xl border`}>
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as read</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700 ml-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
