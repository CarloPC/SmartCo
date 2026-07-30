import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../config/firebase'

// Maps a notification's raw `category` field (set by whichever service created
// it) to the nav item it should badge in the Sidebar / bottom nav. Some
// services historically used slightly different category strings for the
// same module (e.g. 'food_aid' vs 'foodaid'), so both are normalized here.
const NAV_BADGE_CATEGORY_MAP = {
  health: 'health',
  food_aid: 'foodAid',
  foodaid: 'foodAid',
  events: 'events',
  document: 'document',
  emergency: 'emergency',
}

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

  /**
   * Real-time subscription used to badge the sidebar / bottom nav with a red
   * indicator whenever a nav item (Health, Food Aid, Events, Document
   * Requests, Emergencies) has unread notifications, so officials/admins
   * don't miss anything new.
   *
   * `callback` is invoked with an object like { health: 2, foodAid: 1 } —
   * only keys with count > 0 are included. Returns an unsubscribe function.
   */
  subscribeToUnreadCounts(callback) {
    const userId = auth.currentUser?.uid
    if (!userId) {
      callback({})
      return () => {}
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const counts = {}
        snapshot.docs.forEach((docSnap) => {
          const navKey = NAV_BADGE_CATEGORY_MAP[docSnap.data().category]
          if (!navKey) return
          counts[navKey] = (counts[navKey] || 0) + 1
        })
        callback(counts)
      },
      (error) => {
        console.error('Error subscribing to unread counts:', error)
        callback({})
      }
    )
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
      console.log('🔔 [NotificationService] Creating notification with data:', notificationData)
      
      const newNotification = {
        ...notificationData,
        createdAt: new Date().toISOString(),
        read: false
      }

      console.log('📝 [NotificationService] Notification object to be saved:', newNotification)
      
      const docRef = await addDoc(collection(db, 'notifications'), newNotification)
      
      console.log('✅ [NotificationService] Notification created successfully with ID:', docRef.id)
      
      return { success: true, notification: { id: docRef.id, ...newNotification } }
    } catch (error) {
      console.error('❌ [NotificationService] Error creating notification:', error)
      console.error('❌ [NotificationService] Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      return { success: false, error: error.message }
    }
  }
}

export default new NotificationService()