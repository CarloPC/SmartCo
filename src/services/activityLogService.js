import { db } from '../firebaseConfig'
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

const activityLogService = {
  async getActivityLogs(limit_count = 50, filters = {}) {
    try {
      let q = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      )
      
      if (filters.userId) {
        q = query(
          collection(db, 'activityLogs'),
          where('userId', '==', filters.userId),
          orderBy('timestamp', 'desc'),
          limit(limit_count)
        )
      }
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      return []
    }
  },

  async logActivity(userId, action, description, module) {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userId,
        action,
        description,
        module,
        timestamp: serverTimestamp(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  },

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'Unknown'
    }
  }
}

export default activityLogService
