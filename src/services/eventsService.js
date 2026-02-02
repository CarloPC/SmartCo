import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion, where } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class EventsService {
  async getEvents() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('❌ [getEvents] No authenticated user')
        return []
      }

      console.log('📋 [getEvents] Fetching events for user:', userId)

      let snapshot
      try {
        // Try with orderBy first (requires composite index)
        const q = query(
          collection(db, 'events'),
          where('createdBy', '==', userId),
          orderBy('date', 'desc')
        )
        snapshot = await getDocs(q)
        console.log(`✅ [getEvents] Query successful (with orderBy), found ${snapshot.docs.length} events`)
      } catch (error) {
        console.log('⚠️ [getEvents] orderBy failed, trying without it:', error.message)
        // If orderBy fails (no index), fetch without it and sort in memory
        const q = query(
          collection(db, 'events'),
          where('createdBy', '==', userId)
        )
        snapshot = await getDocs(q)
        console.log(`✅ [getEvents] Query successful (without orderBy), found ${snapshot.docs.length} events`)
      }

      const events = snapshot.docs
        .map(doc => {
          const data = doc.data()
          console.log(`📄 Event ID: ${doc.id}, Title: ${data.title}, CreatedBy: ${data.createdBy}`)
          return { id: doc.id, ...data }
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      console.log(`✅ [getEvents] Returning ${events.length} events total`)
      return events
    } catch (error) {
      console.error('❌ [getEvents] Error fetching events:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      return []
    }
  }

  async getEventById(id) {
    try {
      const docRef = doc(db, 'events', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching event:', error)
      return null
    }
  }

  async createEvent(eventData) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.error('❌ [createEvent] No authenticated user')
        throw new Error('User not authenticated')
      }

      console.log('📝 [createEvent] Creating event for user:', userId)
      console.log('📝 [createEvent] Event title:', eventData.title)

      const newEvent = {
        ...eventData,
        status: 'upcoming',
        attendees: [],
        approvalStatus: 'pending',
        createdBy: userId,  // This is the Firebase Auth UID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('📝 [createEvent] Event data prepared, createdBy:', newEvent.createdBy)

      const docRef = await addDoc(collection(db, 'events'), newEvent)
      const event = { id: docRef.id, ...newEvent }

      console.log('✅ [createEvent] Event created successfully, ID:', docRef.id)

      // Create notification
      try {
        await this._createEventNotification(event, 'created')
        console.log('✅ [createEvent] Notification created')
      } catch (notifError) {
        console.warn('⚠️ [createEvent] Failed to create notification:', notifError)
        // Don't fail the whole operation if notification fails
      }

      return { success: true, event }
    } catch (error) {
      console.error('❌ [createEvent] Error creating event:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      throw new Error('Failed to create event: ' + error.message)
    }
  }

  async updateEvent(id, updates) {
    try {
      const docRef = doc(db, 'events', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, event: { id: updatedDoc.id, ...updatedDoc.data() } }
    } catch (error) {
      console.error('Error updating event:', error)
      throw new Error('Event not found')
    }
  }

  async deleteEvent(id) {
    try {
      await deleteDoc(doc(db, 'events', id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting event:', error)
      throw new Error('Event not found')
    }
  }

  async registerAttendee(eventId, userId) {
    try {
      const docRef = doc(db, 'events', eventId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Event not found')
      }

      const event = docSnap.data()
      if (event.attendees && event.attendees.includes(userId)) {
        throw new Error('User already registered for this event')
      }

      await updateDoc(docRef, {
        attendees: arrayUnion(userId)
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, event: { id: updatedDoc.id, ...updatedDoc.data() } }
    } catch (error) {
      console.error('Error registering attendee:', error)
      throw error
    }
  }

  async getUpcomingEvents() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for upcoming events')
        return []
      }

      const q = query(
        collection(db, 'events'),
        where('createdBy', '==', userId)
      )
      const snapshot = await getDocs(q)
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const now = new Date()

      return events.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= now && event.status === 'upcoming'
      }).sort((a, b) => new Date(a.date) - new Date(b.date))
    } catch (error) {
      console.error('Error fetching upcoming events:', error)
      return []
    }
  }

  async getEventStats() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for event stats')
        return { total: 0, upcoming: 0, completed: 0, cancelled: 0 }
      }

      const q = query(
        collection(db, 'events'),
        where('createdBy', '==', userId)
      )
      const snapshot = await getDocs(q)
      const events = snapshot.docs.map(doc => doc.data())
      
      const upcoming = events.filter(e => e.status === 'upcoming').length
      const completed = events.filter(e => e.status === 'completed').length
      const cancelled = events.filter(e => e.status === 'cancelled').length

      return {
        total: events.length,
        upcoming,
        completed,
        cancelled
      }
    } catch (error) {
      console.error('Error fetching event stats:', error)
      return { total: 0, upcoming: 0, completed: 0, cancelled: 0 }
    }
  }

  async _createEventNotification(event, action) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      let message = ''
      if (action === 'created') {
        message = `New event created: ${event.title} on ${event.date}`
      } else if (action === 'updated') {
        message = `Event updated: ${event.title}`
      } else if (action === 'cancelled') {
        message = `Event cancelled: ${event.title}`
      }

      await notificationService.createNotification({
        userId,
        type: 'info',
        category: 'events',
        message,
        relatedId: event.id
      })
    } catch (error) {
      console.error('Error creating event notification:', error)
    }
  }
}

export default new EventsService()
