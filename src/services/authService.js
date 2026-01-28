import storageService from './storageService'

// Simulate API delay
const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Generate a simple token
const generateToken = () => {
  return 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

class AuthService {
  async login(email, password) {
    await simulateDelay()

    const users = storageService.getUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.password !== password) {
      throw new Error('Invalid password')
    }

    // Generate token
    const token = generateToken()
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      purok: user.purok,
      createdAt: user.createdAt
    }

    // Store token and user data
    storageService.setAuthToken(token)
    storageService.setUserData(userData)

    return { token, user: userData }
  }

  async register(userData) {
    await simulateDelay()

    const users = storageService.getUsers()
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create new user
    const newUser = {
      id: 'user_' + Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    storageService.setUsers(users)

    return { success: true, user: newUser }
  }

  logout() {
    storageService.removeAuthToken()
    storageService.removeUserData()
    return { success: true }
  }

  async getCurrentUser() {
    const token = storageService.getAuthToken()
    if (!token) {
      return null
    }

    const userData = storageService.getUserData()
    return userData
  }

  isAuthenticated() {
    const token = storageService.getAuthToken()
    return !!token
  }

  async updateProfile(userId, updates) {
    await simulateDelay()

    const users = storageService.getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error('User not found')
    }

    users[userIndex] = { ...users[userIndex], ...updates }
    storageService.setUsers(users)

    // Update current user data if it's the same user
    const currentUser = storageService.getUserData()
    if (currentUser && currentUser.id === userId) {
      storageService.setUserData({ ...currentUser, ...updates })
    }

    return { success: true, user: users[userIndex] }
  }

  async changePassword(userId, currentPassword, newPassword) {
    await simulateDelay()

    const users = storageService.getUsers()
    const user = users.find(u => u.id === userId)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.password !== currentPassword) {
      throw new Error('Current password is incorrect')
    }

    user.password = newPassword
    storageService.setUsers(users)

    return { success: true }
  }
}

export default new AuthService()
