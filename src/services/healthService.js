import storageService from './storageService'

const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

class HealthService {
  async getHealthRecords() {
    await simulateDelay()
    return storageService.getHealthRecords()
  }

  async getHealthRecordById(id) {
    await simulateDelay()
    const records = storageService.getHealthRecords()
    return records.find(record => record.id === id)
  }

  async createHealthRecord(recordData) {
    await simulateDelay()

    const records = storageService.getHealthRecords()
    const newRecord = {
      id: 'health_' + Date.now(),
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    records.push(newRecord)
    storageService.setHealthRecords(records)

    // Create a notification for the new health record
    this._createHealthNotification(newRecord)

    return { success: true, record: newRecord }
  }

  async updateHealthRecord(id, updates) {
    await simulateDelay()

    const records = storageService.getHealthRecords()
    const recordIndex = records.findIndex(record => record.id === id)

    if (recordIndex === -1) {
      throw new Error('Health record not found')
    }

    records[recordIndex] = {
      ...records[recordIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    storageService.setHealthRecords(records)
    return { success: true, record: records[recordIndex] }
  }

  async deleteHealthRecord(id) {
    await simulateDelay()

    const records = storageService.getHealthRecords()
    const filteredRecords = records.filter(record => record.id !== id)

    if (records.length === filteredRecords.length) {
      throw new Error('Health record not found')
    }

    storageService.setHealthRecords(filteredRecords)
    return { success: true }
  }

  async getHealthStats() {
    await simulateDelay()

    const records = storageService.getHealthRecords()
    
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
      r.overallStatus === 'critical' || r.urgencyLevel === 'urgent'
    ).length

    return {
      total: records.length,
      today: todayRecords.length,
      thisWeek: weekRecords.length,
      emergencies
    }
  }

  _createHealthNotification(record) {
    const notifications = storageService.getNotifications()
    
    let message = ''
    let type = 'info'

    if (record.overallStatus === 'critical') {
      message = `Emergency: Critical health record for patient requires immediate attention`
      type = 'emergency'
    } else if (record.overallStatus === 'concerning') {
      message = `New health checkup recorded with concerning vitals`
      type = 'warning'
    } else {
      message = `New health checkup completed successfully`
      type = 'success'
    }

    const notification = {
      id: 'notif_' + Date.now(),
      type,
      category: 'health',
      message,
      relatedId: record.id,
      createdAt: new Date().toISOString(),
      read: false
    }

    notifications.unshift(notification)
    storageService.setNotifications(notifications)
  }
}

export default new HealthService()
