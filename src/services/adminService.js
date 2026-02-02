import { collection, getDocs, getDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class AdminService {
  // Check if current user is admin or barangay official
  isAdmin(user) {
    return user?.role === 'admin' || user?.role === 'barangay_official'
  }

  isAdminOnly(user) {
    return user?.role === 'admin'
  }

  // Get all users
  async getAllUsers() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const snapshot = await getDocs(collection(db, 'users'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId, newRole) {
    try {
      const docRef = doc(db, 'users', userId)
      await updateDoc(docRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating user role:', error)
      throw new Error('Failed to update user role')
    }
  }

  // Update user status (admin only)
  async updateUserStatus(userId, status) {
    try {
      const docRef = doc(db, 'users', userId)
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating user status:', error)
      throw new Error('Failed to update user status')
    }
  }

  // Get all health records (admin view)
  async getAllHealthRecords() {
    try {
      let snapshot
      try {
        const q = query(
          collection(db, 'healthRecords'),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch (error) {
        snapshot = await getDocs(collection(db, 'healthRecords'))
      }

      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      return records
    } catch (error) {
      console.error('Error fetching all health records:', error)
      return []
    }
  }

  // Get pending health records
  async getPendingHealthRecords() {
    try {
      const q = query(
        collection(db, 'healthRecords'),
        where('approvalStatus', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      return records
    } catch (error) {
      console.error('Error fetching pending health records:', error)
      return []
    }
  }

  // Approve health record
  async approveHealthRecord(recordId) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the health record to find the user
      const docRef = doc(db, 'healthRecords', recordId)
      const recordSnap = await getDoc(docRef)
      
      if (!recordSnap.exists()) {
        throw new Error('Health record not found')
      }

      const record = recordSnap.data()
      console.log('📋 [AdminService] Approving health record:', { recordId, record })
      
      // Update the record
      await updateDoc(docRef, {
        approvalStatus: 'approved',
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user
      if (record.userId) {
        console.log('🔔 [AdminService] Creating approval notification for user:', record.userId)
        const result = await notificationService.createNotification({
          userId: record.userId,
          type: 'success',
          category: 'health',
          message: 'Your health record has been approved by the barangay official.',
          relatedId: recordId,
          relatedType: 'healthRecord'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId found in health record')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error approving health record:', error)
      throw new Error('Failed to approve health record')
    }
  }

  // Reject health record
  async rejectHealthRecord(recordId, reason = '') {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the health record to find the user
      const docRef = doc(db, 'healthRecords', recordId)
      const recordSnap = await getDoc(docRef)
      
      if (!recordSnap.exists()) {
        throw new Error('Health record not found')
      }

      const record = recordSnap.data()
      console.log('📋 [AdminService] Rejecting health record:', { recordId, record, reason })

      // Update the record
      await updateDoc(docRef, {
        approvalStatus: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user
      if (record.userId) {
        const message = reason 
          ? `Your health record has been rejected. Reason: ${reason}`
          : 'Your health record has been rejected by the barangay official.'
        
        console.log('🔔 [AdminService] Creating rejection notification for user:', record.userId)
        const result = await notificationService.createNotification({
          userId: record.userId,
          type: 'error',
          category: 'health',
          message,
          relatedId: recordId,
          relatedType: 'healthRecord'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId found in health record')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error rejecting health record:', error)
      throw new Error('Failed to reject health record')
    }
  }

  // Get all food aid schedules (admin view)
  async getAllFoodAidSchedules() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching all food aid schedules:', error)
      return []
    }
  }

  // Get pending food aid schedules
  async getPendingFoodAidSchedules() {
    try {
      const q = query(
        collection(db, 'foodAid'),
        where('approvalStatus', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching pending food aid schedules:', error)
      return []
    }
  }

  // Approve food aid schedule
  async approveFoodAidSchedule(scheduleId) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the food aid schedule to find the user
      const docRef = doc(db, 'foodAid', scheduleId)
      const scheduleSnap = await getDoc(docRef)
      
      if (!scheduleSnap.exists()) {
        throw new Error('Food aid schedule not found')
      }

      const schedule = scheduleSnap.data()
      console.log('📋 [AdminService] Approving food aid schedule:', { scheduleId, schedule })

      // Update the schedule
      await updateDoc(docRef, {
        approvalStatus: 'approved',
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user (foodAid uses 'createdBy' field)
      const targetUserId = schedule.userId || schedule.createdBy
      if (targetUserId) {
        console.log('🔔 [AdminService] Creating approval notification for user:', targetUserId)
        const result = await notificationService.createNotification({
          userId: targetUserId,
          type: 'success',
          category: 'food_aid',
          message: `Your food aid schedule for ${schedule.purok || 'your area'} has been approved.`,
          relatedId: scheduleId,
          relatedType: 'foodAid'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId/createdBy found in schedule')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error approving food aid schedule:', error)
      throw new Error('Failed to approve food aid schedule')
    }
  }

  // Reject food aid schedule
  async rejectFoodAidSchedule(scheduleId, reason = '') {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the food aid schedule to find the user
      const docRef = doc(db, 'foodAid', scheduleId)
      const scheduleSnap = await getDoc(docRef)
      
      if (!scheduleSnap.exists()) {
        throw new Error('Food aid schedule not found')
      }

      const schedule = scheduleSnap.data()
      console.log('📋 [AdminService] Rejecting food aid schedule:', { scheduleId, schedule, reason })

      // Update the schedule
      await updateDoc(docRef, {
        approvalStatus: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user (foodAid uses 'createdBy' field)
      const targetUserId = schedule.userId || schedule.createdBy
      if (targetUserId) {
        const message = reason 
          ? `Your food aid schedule for ${schedule.purok || 'your area'} has been rejected. Reason: ${reason}`
          : `Your food aid schedule for ${schedule.purok || 'your area'} has been rejected.`
        
        console.log('🔔 [AdminService] Creating rejection notification for user:', targetUserId)
        const result = await notificationService.createNotification({
          userId: targetUserId,
          type: 'error',
          category: 'food_aid',
          message,
          relatedId: scheduleId,
          relatedType: 'foodAid'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId/createdBy found in schedule')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error rejecting food aid schedule:', error)
      throw new Error('Failed to reject food aid schedule')
    }
  }

  // Get all events (admin view)
  async getAllEvents() {
    try {
      let snapshot
      try {
        const q = query(
          collection(db, 'events'),
          orderBy('date', 'desc')
        )
        snapshot = await getDocs(q)
      } catch (error) {
        snapshot = await getDocs(collection(db, 'events'))
      }

      const events = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      
      return events
    } catch (error) {
      console.error('Error fetching all events:', error)
      return []
    }
  }

  // Get pending events
  async getPendingEvents() {
    try {
      const q = query(
        collection(db, 'events'),
        where('approvalStatus', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      
      const events = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      
      return events
    } catch (error) {
      console.error('Error fetching pending events:', error)
      return []
    }
  }

  // Approve event
  async approveEvent(eventId) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the event to find the user
      const docRef = doc(db, 'events', eventId)
      const eventSnap = await getDoc(docRef)
      
      if (!eventSnap.exists()) {
        throw new Error('Event not found')
      }

      const event = eventSnap.data()
      console.log('📋 [AdminService] Approving event:', { eventId, event })

      // Update the event
      await updateDoc(docRef, {
        approvalStatus: 'approved',
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user (events use 'createdBy' field)
      const targetUserId = event.userId || event.createdBy
      if (targetUserId) {
        console.log('🔔 [AdminService] Creating approval notification for user:', targetUserId)
        const result = await notificationService.createNotification({
          userId: targetUserId,
          type: 'success',
          category: 'events',
          message: `Your event "${event.title || 'Event'}" has been approved and scheduled.`,
          relatedId: eventId,
          relatedType: 'event'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId/createdBy found in event')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error approving event:', error)
      throw new Error('Failed to approve event')
    }
  }

  // Reject event
  async rejectEvent(eventId, reason = '') {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // Get the event to find the user
      const docRef = doc(db, 'events', eventId)
      const eventSnap = await getDoc(docRef)
      
      if (!eventSnap.exists()) {
        throw new Error('Event not found')
      }

      const event = eventSnap.data()
      console.log('📋 [AdminService] Rejecting event:', { eventId, event, reason })

      // Update the event
      await updateDoc(docRef, {
        approvalStatus: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      })

      // Create notification for the user (events use 'createdBy' field)
      const targetUserId = event.userId || event.createdBy
      if (targetUserId) {
        const message = reason 
          ? `Your event "${event.title || 'Event'}" has been rejected. Reason: ${reason}`
          : `Your event "${event.title || 'Event'}" has been rejected.`
        
        console.log('🔔 [AdminService] Creating rejection notification for user:', targetUserId)
        const result = await notificationService.createNotification({
          userId: targetUserId,
          type: 'error',
          category: 'events',
          message,
          relatedId: eventId,
          relatedType: 'event'
        })
        console.log('✅ [AdminService] Notification created:', result)
      } else {
        console.warn('⚠️ [AdminService] No userId/createdBy found in event')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [AdminService] Error rejecting event:', error)
      throw new Error('Failed to reject event')
    }
  }

  // Get admin dashboard stats
  async getAdminStats() {
    try {
      // Fetch all collections in parallel
      const [usersSnap, healthSnap, foodAidSnap, eventsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'healthRecords')),
        getDocs(collection(db, 'foodAid')),
        getDocs(collection(db, 'events'))
      ])

      const users = usersSnap.docs.map(doc => doc.data())
      const healthRecords = healthSnap.docs.map(doc => doc.data())
      const foodAid = foodAidSnap.docs.map(doc => doc.data())
      const events = eventsSnap.docs.map(doc => doc.data())

      return {
        totalUsers: users.length,
        totalResidents: users.filter(u => u.role === 'resident').length,
        totalOfficials: users.filter(u => u.role === 'barangay_official' || u.role === 'admin').length,
        
        totalHealthRecords: healthRecords.length,
        pendingHealthRecords: healthRecords.filter(r => r.approvalStatus === 'pending').length,
        approvedHealthRecords: healthRecords.filter(r => r.approvalStatus === 'approved').length,
        
        totalFoodAid: foodAid.length,
        pendingFoodAid: foodAid.filter(f => f.approvalStatus === 'pending').length,
        approvedFoodAid: foodAid.filter(f => f.approvalStatus === 'approved').length,
        
        totalEvents: events.length,
        pendingEvents: events.filter(e => e.approvalStatus === 'pending').length,
        approvedEvents: events.filter(e => e.approvalStatus === 'approved').length,
        
        totalPending: 
          healthRecords.filter(r => r.approvalStatus === 'pending').length +
          foodAid.filter(f => f.approvalStatus === 'pending').length +
          events.filter(e => e.approvalStatus === 'pending').length
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      return {
        totalUsers: 0,
        totalResidents: 0,
        totalOfficials: 0,
        totalHealthRecords: 0,
        pendingHealthRecords: 0,
        approvedHealthRecords: 0,
        totalFoodAid: 0,
        pendingFoodAid: 0,
        approvedFoodAid: 0,
        totalEvents: 0,
        pendingEvents: 0,
        approvedEvents: 0,
        totalPending: 0
      }
    }
  }
}

export default new AdminService()
