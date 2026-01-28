import storageService from './storageService'

const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

class NotificationService {
  async getNotifications() {
    await simulateDelay()
    return storageService.getNotifications()
  }

  async getUnreadCount() {
    await simulateDelay()
    const notifications = storageService.getNotifications()
    return notifications.filter(n => !n.read).length
  }

  async markAsRead(notificationId) {
    await simulateDelay()

    const notifications = storageService.getNotifications()
    const notification = notifications.find(n => n.id === notificationId)

    if (notification) {
      notification.read = true
      storageService.setNotifications(notifications)
    }

    return { success: true }
  }

  async markAllAsRead() {
    await simulateDelay()

    const notifications = storageService.getNotifications()
    notifications.forEach(n => n.read = true)
    storageService.setNotifications(notifications)

    return { success: true }
  }

  async deleteNotification(notificationId) {
    await simulateDelay()

    const notifications = storageService.getNotifications()
    const filteredNotifications = notifications.filter(n => n.id !== notificationId)

    storageService.setNotifications(filteredNotifications)
    return { success: true }
  }

  async clearAll() {
    await simulateDelay()
    storageService.setNotifications([])
    return { success: true }
  }

  async createNotification(notificationData) {
    await simulateDelay()

    const notifications = storageService.getNotifications()
    const newNotification = {
      id: 'notif_' + Date.now(),
      ...notificationData,
      createdAt: new Date().toISOString(),
      read: false
    }

    notifications.unshift(newNotification)
    storageService.setNotifications(notifications)

    return { success: true, notification: newNotification }
  }
}

export default new NotificationService()
