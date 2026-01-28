import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class HealthService {
  async getHealthRecords() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for health records')
        return []
      }

      let snapshot
      try {
        // Try with orderBy first (requires composite index)
        const q = query(
          collection(db, 'healthRecords'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch (error) {
        console.log('orderBy failed, trying without it:', error.message)
        // If orderBy fails (no index), fetch without it and sort in memory
        const q = query(
          collection(db, 'healthRecords'),
          where('userId', '==', userId)
        )
        snapshot = await getDocs(q)
      }

      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      console.log('Total health records:', records.length)
      return records
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
      console.log('Creating health record for userId:', userId)
      
      if (!userId) {
        console.error('No authenticated user found')
        throw new Error('User not authenticated')
      }

      const newRecord = {
        ...recordData,
        userId,
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('Health record to be saved:', { ...newRecord, formData: 'hidden for brevity' })

      const docRef = await addDoc(collection(db, 'healthRecords'), newRecord)
      const record = { id: docRef.id, ...newRecord }

      console.log('Health record saved with ID:', docRef.id)

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
        console.log('No authenticated user found')
        return { total: 0, today: 0, thisWeek: 0, emergencies: 0 }
      }

      const q = query(
        collection(db, 'healthRecords'),
        where('userId', '==', userId)
      )

      const snapshot = await getDocs(q)
      const records = snapshot.docs.map(doc => doc.data())
      
      console.log('Health records found:', records.length)
      
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

  async getRecentHealthAlerts(limit = 5) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for health alerts')
        return []
      }

      let snapshot
      try {
        // Try with orderBy first (requires composite index)
        const q = query(
          collection(db, 'healthRecords'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch (error) {
        console.log('orderBy failed, trying without it:', error.message)
        // If orderBy fails (no index), fetch without it and sort in memory
        const q = query(
          collection(db, 'healthRecords'),
          where('userId', '==', userId)
        )
        snapshot = await getDocs(q)
      }

      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
      
      console.log('Health alerts found:', records.length)

      return records.map(record => {
        const assessment = record.healthAssessment
        let type = 'Checkup'
        let urgent = false

        if (assessment?.overallStatus === 'critical') {
          type = 'Emergency'
          urgent = true
        } else if (assessment?.overallStatus === 'concerning') {
          type = 'Alert'
          urgent = false
        }

        return {
          id: record.id,
          type,
          message: assessment?.vitalsSummary || 'Health checkup completed',
          createdAt: record.createdAt,
          urgent,
          recordedBy: record.recordedBy || 'Health Worker',
          approvalStatus: record.approvalStatus || 'approved'
        }
      })
    } catch (error) {
      console.error('Error fetching recent health alerts:', error)
      return []
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
