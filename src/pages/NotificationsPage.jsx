import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Trash2, Check, X, Loader2, AlertTriangle, Calendar, Heart, Package, AlertCircle, FileText, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const isOfficial = (user) => user?.role === 'admin' || user?.role === 'barangay_official'
// AdminRoute additionally lets 'bhw' reach /emergency, so the notification
// link needs its own check here rather than reusing isOfficial() (which is
// also used by the unrelated document-notification routing below).
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
    case 'role_upgrade':
      return isOfficial(user) ? '/admin/role-requests' : '/request-role-upgrade'
    case 'community':
    default:
      return '/home'
  }
}

const getNotificationLabel = (notification) => {
  const category = notification.category || notification.type
  switch (category) {
    case 'events':
      return 'View Events'
    case 'health':
      return 'View Health'
    case 'food_aid':
    case 'foodaid':
      return 'View Community Assistance'
    case 'emergency':
      return 'View Emergency'
    case 'document':
      return 'View Document Requests'
    case 'role_upgrade':
      return 'View Application Status'
    case 'community':
      return 'View Community'
    default:
      return 'Go to Home'
  }
}
import notificationService from '../services/notificationService'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /* glass card  matches HomePage panels */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'

  // Fetch notifications from Firebase
  useEffect(() => {
    console.log('Ã°Å¸ [NotificationsPage] Fetching notifications...')
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Ã°Å¸œ¹ [NotificationsPage] Calling notificationService.getNotifications()')
      const fetchedNotifications = await notificationService.getNotifications()

      console.log(`Ã¢Å“¦ [NotificationsPage] Received ${fetchedNotifications.length} notifications`)
      setNotifications(fetchedNotifications)
    } catch (err) {
      console.error('Ã¢Å’ [NotificationsPage] Error fetching notifications:', err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      console.log(`Ã°Å¸œ [NotificationsPage] Marking notification ${id} as read`)
      const result = await notificationService.markAsRead(id)

      if (result.success) {
        setNotifications(notifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        ))
        window.dispatchEvent(new Event('notifications-updated'))
        console.log('Ã¢Å“¦ [NotificationsPage] Notification marked as read')
      }
    } catch (err) {
      console.error('Ã¢Å’ [NotificationsPage] Error marking as read:', err)
      alert('Failed to mark as read. Please try again.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Ã°Å¸œ [NotificationsPage] Marking all notifications as read')
      const result = await notificationService.markAllAsRead()

      if (result.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })))
        window.dispatchEvent(new Event('notifications-updated'))
        console.log('Ã¢Å“¦ [NotificationsPage] All notifications marked as read')
      }
    } catch (err) {
      console.error('Ã¢Å’ [NotificationsPage] Error marking all as read:', err)
      alert('Failed to mark all as read. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      console.log(`[NotificationsPage] Deleting notification ${id}`)
      const result = await notificationService.deleteNotification(id)

      if (result.success) {
        setNotifications(notifications.filter(notif => notif.id !== id))
        console.log('Ã¢Å“¦ [NotificationsPage] Notification deleted')
      }
    } catch (err) {
      console.error('Ã¢Å’ [NotificationsPage] Error deleting notification:', err)
      alert('Failed to delete notification. Please try again.')
    }
  }

  const handleViewNotification = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }
    navigate(getNotificationPath(notification, user))
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) {
      return
    }

    try {
      console.log('[NotificationsPage] Clearing all notifications')
      const result = await notificationService.clearAll()

      if (result.success) {
        setNotifications([])
        console.log('Ã¢Å“¦ [NotificationsPage] All notifications cleared')
      }
    } catch (err) {
      console.error('Ã¢Å’ [NotificationsPage] Error clearing all:', err)
      alert('Failed to clear notifications. Please try again.')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Map notification categories to icons + HomePage-style gradient badges
  const getCategoryVisual = (category) => {
    switch (category) {
      case 'events':
        return { icon: Calendar, iconBg: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500', iconRing: 'ring-violet-300/40' }
      case 'health':
        return { icon: Heart, iconBg: 'bg-gradient-to-br from-rose-500 via-pink-500 to-red-500', iconRing: 'ring-rose-300/40' }
      case 'food_aid':
        return { icon: Package, iconBg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500', iconRing: 'ring-emerald-300/40' }
      case 'emergency':
        return { icon: AlertTriangle, iconBg: 'bg-gradient-to-br from-rose-500 via-red-500 to-orange-600', iconRing: 'ring-rose-300/40' }
      case 'document':
        return { icon: FileText, iconBg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-sky-500', iconRing: 'ring-blue-300/40' }
      default:
        return { icon: Bell, iconBg: 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500', iconRing: 'ring-sky-300/40' }
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
    /* No background here  Layout.jsx paints the gradient behind everything */
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/20 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {!isLoading && unreadCount > 0 && (
            <p className="text-sm text-blue-200">{unreadCount} unread</p>
          )}
        </div>
        <div className="w-10" />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 p-4 backdrop-blur-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-300" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-200">
                {error}
              </p>
              <button
                onClick={fetchNotifications}
                className="mt-2 text-sm font-semibold text-rose-200 hover:text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className={`${card} p-12 text-center`}>
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-white" />
          <p className="text-sm text-white/60">
            Loading notifications...
          </p>
        </div>
      ) : (
        <>
          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between space-x-3">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center space-x-2 text-sm font-medium text-blue-200 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-2 text-sm font-medium text-rose-300 transition hover:text-rose-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className={`${card} p-12 text-center`}>
                <Bell className="mx-auto mb-4 h-16 w-16 text-white/30" />
                <h3 className="mb-2 text-lg font-semibold text-white">No Notifications</h3>
                <p className="text-white/60">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon: CategoryIcon, iconBg, iconRing } = getCategoryVisual(notification.category)
                return (
                  <div
                    key={notification.id}
                    className={`${card} overflow-hidden ${
                      !notification.read ? 'ring-2 ring-blue-400/60' : ''
                    }`}
                  >
                    {/* Clickable card body */}
                    <button
                      onClick={() => handleViewNotification(notification)}
                      className="w-full p-4 text-left transition hover:bg-white/5"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg ring-2 ${iconBg} ${iconRing}`}>
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="mb-1 flex items-start justify-between">
                            <h4 className="font-semibold text-white">
                              {notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : 'Notification'}
                            </h4>
                            {!notification.read && (
                              <span className="ml-2 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></span>
                            )}
                          </div>
                          <p className="mb-2 text-sm text-white/70">
                            {notification.message}
                          </p>
                          <p className="text-xs text-white/40">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Action row */}
                    <div className="flex items-center space-x-4 border-t border-white/10 px-4 pb-3 pt-3">
                      {/* View button */}
                      <button
                        onClick={() => handleViewNotification(notification)}
                        className="flex items-center space-x-1 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>{getNotificationLabel(notification)}</span>
                      </button>

                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex items-center space-x-1 text-sm font-medium text-blue-300 transition hover:text-blue-200"
                        >
                          <Check className="h-4 w-4" />
                          <span>Mark as read</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="ml-auto flex items-center space-x-1 text-sm font-medium text-rose-300 transition hover:text-rose-200"
                      >
                        <X className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationsPage