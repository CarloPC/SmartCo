import storageService from './storageService'

const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

class FoodAidService {
  async getFoodAidSchedules() {
    await simulateDelay()
    return storageService.getFoodAid()
  }

  async getFoodAidById(id) {
    await simulateDelay()
    const foodAid = storageService.getFoodAid()
    return foodAid.find(item => item.id === id)
  }

  async createFoodAidSchedule(scheduleData) {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
    const newSchedule = {
      id: 'foodaid_' + Date.now(),
      ...scheduleData,
      status: 'scheduled',
      deliveredFamilies: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    foodAid.push(newSchedule)
    storageService.setFoodAid(foodAid)

    // Create notification
    this._createFoodAidNotification(newSchedule, 'scheduled')

    return { success: true, schedule: newSchedule }
  }

  async updateFoodAidSchedule(id, updates) {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
    const scheduleIndex = foodAid.findIndex(item => item.id === id)

    if (scheduleIndex === -1) {
      throw new Error('Food aid schedule not found')
    }

    foodAid[scheduleIndex] = {
      ...foodAid[scheduleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    storageService.setFoodAid(foodAid)
    return { success: true, schedule: foodAid[scheduleIndex] }
  }

  async updateDeliveryStatus(id, deliveredCount) {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
    const schedule = foodAid.find(item => item.id === id)

    if (!schedule) {
      throw new Error('Food aid schedule not found')
    }

    schedule.deliveredFamilies = deliveredCount
    
    if (deliveredCount >= schedule.totalFamilies) {
      schedule.status = 'completed'
    } else if (deliveredCount > 0) {
      schedule.status = 'in-progress'
    }

    schedule.updatedAt = new Date().toISOString()
    storageService.setFoodAid(foodAid)

    return { success: true, schedule }
  }

  async deleteFoodAidSchedule(id) {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
    const filteredFoodAid = foodAid.filter(item => item.id !== id)

    if (foodAid.length === filteredFoodAid.length) {
      throw new Error('Food aid schedule not found')
    }

    storageService.setFoodAid(filteredFoodAid)
    return { success: true }
  }

  async getFoodAidStats() {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
    
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
  }

  async getDistributionByPurok() {
    await simulateDelay()

    const foodAid = storageService.getFoodAid()
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
  }

  _createFoodAidNotification(schedule, action) {
    const notifications = storageService.getNotifications()
    
    let message = ''
    if (action === 'scheduled') {
      message = `Food aid scheduled for ${schedule.purok} on ${schedule.date}`
    } else if (action === 'completed') {
      message = `Food aid distribution completed for ${schedule.purok}`
    }

    const notification = {
      id: 'notif_' + Date.now(),
      type: 'info',
      category: 'foodaid',
      message,
      relatedId: schedule.id,
      createdAt: new Date().toISOString(),
      read: false
    }

    notifications.unshift(notification)
    storageService.setNotifications(notifications)
  }
}

export default new FoodAidService()
