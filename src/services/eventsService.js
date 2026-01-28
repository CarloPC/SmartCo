import storageService from './storageService'

const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

class EventsService {
  async getEvents() {
    await simulateDelay()
    return storageService.getEvents()
  }

  async getEventById(id) {
    await simulateDelay()
    const events = storageService.getEvents()
    return events.find(event => event.id === id)
  }

  async createEvent(eventData) {
    await simulateDelay()

    const events = storageService.getEvents()
    const newEvent = {
      id: 'event_' + Date.now(),
      ...eventData,
      status: 'upcoming',
      attendees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    events.push(newEvent)
    storageService.setEvents(events)

    // Create notification
    this._createEventNotification(newEvent, 'created')

    return { success: true, event: newEvent }
  }

  async updateEvent(id, updates) {
    await simulateDelay()

    const events = storageService.getEvents()
    const eventIndex = events.findIndex(event => event.id === id)

    if (eventIndex === -1) {
      throw new Error('Event not found')
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    storageService.setEvents(events)
    return { success: true, event: events[eventIndex] }
  }

  async deleteEvent(id) {
    await simulateDelay()

    const events = storageService.getEvents()
    const filteredEvents = events.filter(event => event.id !== id)

    if (events.length === filteredEvents.length) {
      throw new Error('Event not found')
    }

    storageService.setEvents(filteredEvents)
    return { success: true }
  }

  async registerAttendee(eventId, userId) {
    await simulateDelay()

    const events = storageService.getEvents()
    const event = events.find(e => e.id === eventId)

    if (!event) {
      throw new Error('Event not found')
    }

    if (!event.attendees) {
      event.attendees = []
    }

    if (event.attendees.includes(userId)) {
      throw new Error('User already registered for this event')
    }

    event.attendees.push(userId)
    storageService.setEvents(events)

    return { success: true, event }
  }

  async getUpcomingEvents() {
    await simulateDelay()

    const events = storageService.getEvents()
    const now = new Date()

    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && event.status === 'upcoming'
    }).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  async getEventStats() {
    await simulateDelay()

    const events = storageService.getEvents()
    
    const upcoming = events.filter(e => e.status === 'upcoming').length
    const completed = events.filter(e => e.status === 'completed').length
    const cancelled = events.filter(e => e.status === 'cancelled').length

    return {
      total: events.length,
      upcoming,
      completed,
      cancelled
    }
  }

  _createEventNotification(event, action) {
    const notifications = storageService.getNotifications()
    
    let message = ''
    if (action === 'created') {
      message = `New event created: ${event.title} on ${event.date}`
    } else if (action === 'updated') {
      message = `Event updated: ${event.title}`
    } else if (action === 'cancelled') {
      message = `Event cancelled: ${event.title}`
    }

    const notification = {
      id: 'notif_' + Date.now(),
      type: 'info',
      category: 'events',
      message,
      relatedId: event.id,
      createdAt: new Date().toISOString(),
      read: false
    }

    notifications.unshift(notification)
    storageService.setNotifications(notifications)
  }
}

export default new EventsService()
