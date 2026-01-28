// localStorage wrapper for data persistence
// This can be easily replaced with real API calls later

const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartco_auth_token',
  USER_DATA: 'smartco_user_data',
  HEALTH_RECORDS: 'smartco_health_records',
  EVENTS: 'smartco_events',
  FOOD_AID: 'smartco_food_aid',
  NOTIFICATIONS: 'smartco_notifications',
  USERS: 'smartco_users'
}

class StorageService {
  // Generic methods
  get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error writing to storage:', error)
      return false
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from storage:', error)
      return false
    }
  }

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing storage:', error)
      return false
    }
  }

  // Auth specific methods
  getAuthToken() {
    return this.get(STORAGE_KEYS.AUTH_TOKEN)
  }

  setAuthToken(token) {
    return this.set(STORAGE_KEYS.AUTH_TOKEN, token)
  }

  removeAuthToken() {
    return this.remove(STORAGE_KEYS.AUTH_TOKEN)
  }

  getUserData() {
    return this.get(STORAGE_KEYS.USER_DATA)
  }

  setUserData(userData) {
    return this.set(STORAGE_KEYS.USER_DATA, userData)
  }

  removeUserData() {
    return this.remove(STORAGE_KEYS.USER_DATA)
  }

  // Health records methods
  getHealthRecords() {
    return this.get(STORAGE_KEYS.HEALTH_RECORDS) || []
  }

  setHealthRecords(records) {
    return this.set(STORAGE_KEYS.HEALTH_RECORDS, records)
  }

  // Events methods
  getEvents() {
    return this.get(STORAGE_KEYS.EVENTS) || []
  }

  setEvents(events) {
    return this.set(STORAGE_KEYS.EVENTS, events)
  }

  // Food aid methods
  getFoodAid() {
    return this.get(STORAGE_KEYS.FOOD_AID) || []
  }

  setFoodAid(foodAid) {
    return this.set(STORAGE_KEYS.FOOD_AID, foodAid)
  }

  // Notifications methods
  getNotifications() {
    return this.get(STORAGE_KEYS.NOTIFICATIONS) || []
  }

  setNotifications(notifications) {
    return this.set(STORAGE_KEYS.NOTIFICATIONS, notifications)
  }

  // Users methods (for registration)
  getUsers() {
    return this.get(STORAGE_KEYS.USERS) || []
  }

  setUsers(users) {
    return this.set(STORAGE_KEYS.USERS, users)
  }
}

export default new StorageService()
export { STORAGE_KEYS }
