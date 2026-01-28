import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { db, auth } from '../config/firebase'

class NotificationService {
  async getNotifications() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return []
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async getUnreadCount() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return 0
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.length
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  async markAsRead(notificationId) {
    try {
      const docRef = doc(db, 'notifications', notificationId)
      await updateDoc(docRef, { read: true })
      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false }
    }
  }

  async markAllAsRead() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return { success: false }
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )

      const snapshot = await getDocs(q)
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      )

      await Promise.all(updatePromises)
      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false }
    }
  }

  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false }
    }
  }

  async clearAll() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return { success: false }
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      )

      const snapshot = await getDocs(q)
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))

      await Promise.all(deletePromises)
      return { success: true }
    } catch (error) {
      console.error('Error clearing all notifications:', error)
      return { success: false }
    }
  }

  async createNotification(notificationData) {
    try {
      const newNotification = {
        ...notificationData,
        createdAt: new Date().toISOString(),
        read: false
      }

      const docRef = await addDoc(collection(db, 'notifications'), newNotification)
      return { success: true, notification: { id: docRef.id, ...newNotification } }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false }
    }
  }
}

export default new NotificationService()
