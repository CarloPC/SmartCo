import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class EventsService {
  async getEvents() {
    try {
      const q = query(collection(db, 'events'), orderBy('date', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching events:', error)
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
        throw new Error('User not authenticated')
      }

      const newEvent = {
        ...eventData,
        status: 'upcoming',
        attendees: [],
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await addDoc(collection(db, 'events'), newEvent)
      const event = { id: docRef.id, ...newEvent }

      // Create notification
      await this._createEventNotification(event, 'created')

      return { success: true, event }
    } catch (error) {
      console.error('Error creating event:', error)
      throw new Error('Failed to create event')
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
      const snapshot = await getDocs(collection(db, 'events'))
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
      const snapshot = await getDocs(collection(db, 'events'))
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
