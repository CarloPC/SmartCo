import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

class AuthService {
  // Login with Firebase Auth
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      
      return {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          email: user.email,
          fullName: userData?.fullName || '',
          phone: userData?.phone || '',
          role: userData?.role || '',
          purok: userData?.purok || '',
          createdAt: userData?.createdAt || new Date().toISOString()
        }
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Register with Firebase Auth + Firestore
  async register(userData) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      const user = userCredential.user

      // Update display name
      await updateProfile(user, {
        displayName: userData.fullName
      })

      // Save additional data to Firestore
      const userDataToSave = {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        purok: userData.purok,
        createdAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', user.uid), userDataToSave)

      return { 
        success: true, 
        user: {
          id: user.uid,
          ...userDataToSave
        }
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      throw new Error('Failed to logout')
    }
  }

  // Get current user
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe()
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            const userData = userDoc.data()
            resolve({
              id: user.uid,
              email: user.email,
              fullName: userData?.fullName || '',
              phone: userData?.phone || '',
              role: userData?.role || '',
              purok: userData?.purok || '',
              createdAt: userData?.createdAt || new Date().toISOString()
            })
          } catch (error) {
            console.error('Error fetching user data:', error)
            resolve(null)
          }
        } else {
          resolve(null)
        }
      }, reject)
    })
  }

  // Check if authenticated
  isAuthenticated() {
    return !!auth.currentUser
  }

  // Update profile
  async updateProfile(userId, updates) {
    try {
      await updateDoc(doc(db, 'users', userId), updates)
      
      // Update display name in auth if fullName changed
      if (updates.fullName && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.fullName
        })
      }
      
      return { success: true, user: updates }
    } catch (error) {
      throw new Error('Failed to update profile')
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      
      // Re-authenticate
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, newPassword)
      return { success: true }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect')
      }
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Helper: Convert Firebase error codes to user-friendly messages
  getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'User with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Try again later',
      'auth/invalid-credential': 'Invalid email or password'
    }
    return messages[code] || 'An error occurred. Please try again.'
  }
}

export default new AuthService()
