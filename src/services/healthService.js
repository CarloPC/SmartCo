import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class HealthService {
  async getHealthRecords() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return []
      }

      const q = query(
        collection(db, 'healthRecords'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching health records:', error)
      return []
    }
  }

  async getHealthRecordById(id) {
    try {
      const docRef = doc(db, 'healthRecords', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching health record:', error)
      return null
    }
  }

  async createHealthRecord(recordData) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const newRecord = {
        ...recordData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'healthRecords'), newRecord)
      const record = { id: docRef.id, ...newRecord }

      // Create a notification for the new health record
      await this._createHealthNotification(record)

      return { success: true, record }
    } catch (error) {
      console.error('Error creating health record:', error)
      throw new Error('Failed to create health record')
    }
  }

  async updateHealthRecord(id, updates) {
    try {
      const docRef = doc(db, 'healthRecords', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, record: { id: updatedDoc.id, ...updatedDoc.data() } }
    } catch (error) {
      console.error('Error updating health record:', error)
      throw new Error('Health record not found')
    }
  }

  async deleteHealthRecord(id) {
    try {
      await deleteDoc(doc(db, 'healthRecords', id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting health record:', error)
      throw new Error('Health record not found')
    }
  }

  async getHealthStats() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        return { total: 0, today: 0, thisWeek: 0, emergencies: 0 }
      }

      const q = query(
        collection(db, 'healthRecords'),
        where('userId', '==', userId)
      )

      const snapshot = await getDocs(q)
      const records = snapshot.docs.map(doc => doc.data())
      
      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayRecords = records.filter(r => {
        const recordDate = new Date(r.createdAt)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate.getTime() === today.getTime()
      })

      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - 7)

      const weekRecords = records.filter(r => new Date(r.createdAt) >= thisWeek)

      const emergencies = records.filter(r => 
        r.healthAssessment?.overallStatus === 'critical' || 
        r.healthAssessment?.urgencyLevel === 'urgent'
      ).length

      return {
        total: records.length,
        today: todayRecords.length,
        thisWeek: weekRecords.length,
        emergencies
      }
    } catch (error) {
      console.error('Error fetching health stats:', error)
      return { total: 0, today: 0, thisWeek: 0, emergencies: 0 }
    }
  }

  async _createHealthNotification(record) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      let message = ''
      let type = 'info'

      if (record.healthAssessment?.overallStatus === 'critical') {
        message = `Emergency: Critical health record requires immediate attention`
        type = 'emergency'
      } else if (record.healthAssessment?.overallStatus === 'concerning') {
        message = `New health checkup recorded with concerning vitals`
        type = 'warning'
      } else {
        message = `New health checkup completed successfully`
        type = 'success'
      }

      await notificationService.createNotification({
        userId,
        type,
        category: 'health',
        message,
        relatedId: record.id
      })
    } catch (error) {
      console.error('Error creating health notification:', error)
    }
  }
}

export default new HealthService()
