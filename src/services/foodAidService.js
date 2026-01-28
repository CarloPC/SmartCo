import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class FoodAidService {
  async getFoodAidSchedules() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching food aid schedules:', error)
      return []
    }
  }

  async getFoodAidById(id) {
    try {
      const docRef = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching food aid schedule:', error)
      return null
    }
  }

  async createFoodAidSchedule(scheduleData) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const newSchedule = {
        ...scheduleData,
        status: 'scheduled',
        deliveredFamilies: 0,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'foodAid'), newSchedule)
      const schedule = { id: docRef.id, ...newSchedule }

      // Create notification
      await this._createFoodAidNotification(schedule, 'scheduled')

      return { success: true, schedule }
    } catch (error) {
      console.error('Error creating food aid schedule:', error)
      throw new Error('Failed to create food aid schedule')
    }
  }

  async updateFoodAidSchedule(id, updates) {
    try {
      const docRef = doc(db, 'foodAid', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: { id: updatedDoc.id, ...updatedDoc.data() } }
    } catch (error) {
      console.error('Error updating food aid schedule:', error)
      throw new Error('Food aid schedule not found')
    }
  }

  async updateDeliveryStatus(id, deliveredCount) {
    try {
      const docRef = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Food aid schedule not found')
      }

      const schedule = docSnap.data()
      let status = 'scheduled'

      if (deliveredCount >= schedule.totalFamilies) {
        status = 'completed'
      } else if (deliveredCount > 0) {
        status = 'in-progress'
      }

      await updateDoc(docRef, {
        deliveredFamilies: deliveredCount,
        status,
        updatedAt: new Date().toISOString()
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: { id: updatedDoc.id, ...updatedDoc.data() } }
    } catch (error) {
      console.error('Error updating delivery status:', error)
      throw error
    }
  }

  async deleteFoodAidSchedule(id) {
    try {
      await deleteDoc(doc(db, 'foodAid', id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting food aid schedule:', error)
      throw new Error('Food aid schedule not found')
    }
  }

  async getFoodAidStats() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      const foodAid = snapshot.docs.map(doc => doc.data())
      
      const totalFamilies = foodAid.reduce((sum, item) => sum + (item.totalFamilies || 0), 0)
      const deliveredFamilies = foodAid.reduce((sum, item) => sum + (item.deliveredFamilies || 0), 0)
      const pending = foodAid.filter(item => item.status === 'scheduled').length
      const inProgress = foodAid.filter(item => item.status === 'in-progress').length
      const completed = foodAid.filter(item => item.status === 'completed').length

      return {
        total: foodAid.length,
        totalFamilies,
        deliveredFamilies,
        progress: totalFamilies > 0 ? Math.round((deliveredFamilies / totalFamilies) * 100) : 0,
        pending,
        inProgress,
        completed
      }
    } catch (error) {
      console.error('Error fetching food aid stats:', error)
      return {
        total: 0,
        totalFamilies: 0,
        deliveredFamilies: 0,
        progress: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
      }
    }
  }

  async getDistributionByPurok() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      const foodAid = snapshot.docs.map(doc => doc.data())
      const purokData = {}

      foodAid.forEach(item => {
        if (!purokData[item.purok]) {
          purokData[item.purok] = {
            purok: item.purok,
            totalFamilies: 0,
            deliveredFamilies: 0,
            schedules: 0
          }
        }

        purokData[item.purok].totalFamilies += item.totalFamilies || 0
        purokData[item.purok].deliveredFamilies += item.deliveredFamilies || 0
        purokData[item.purok].schedules += 1
      })

      return Object.values(purokData)
    } catch (error) {
      console.error('Error fetching distribution by purok:', error)
      return []
    }
  }

  async _createFoodAidNotification(schedule, action) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      let message = ''
      if (action === 'scheduled') {
        message = `Food aid scheduled for ${schedule.purok} on ${schedule.date}`
      } else if (action === 'completed') {
        message = `Food aid distribution completed for ${schedule.purok}`
      }

      await notificationService.createNotification({
        userId,
        type: 'info',
        category: 'foodaid',
        message,
        relatedId: schedule.id
      })
    } catch (error) {
      console.error('Error creating food aid notification:', error)
    }
  }
}

export default new FoodAidService()
