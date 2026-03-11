import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, query, where, orderBy
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'

class AdminRequestService {
  // Submit a new admin access request
  async submitRequest(data) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('Not authenticated')

      // Check for existing pending request
      const existing = await this.getUserRequest(userId)
      if (existing && existing.status === 'pending') {
        return { success: false, error: 'You already have a pending request.' }
      }

      await addDoc(collection(db, 'adminRequests'), {
        userId,
        fullName: data.fullName,
        email: data.email,
        purok: data.purok || '',
        currentRole: data.currentRole || 'resident',
        reason: data.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: ''
      })

      return { success: true }
    } catch (error) {
      console.error('Error submitting admin request:', error)
      return { success: false, error: error.message }
    }
  }

  // Get the most recent request for a specific user
  async getUserRequest(userId) {
    try {
      let snapshot
      try {
        const q = query(
          collection(db, 'adminRequests'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch {
        // Fallback without orderBy if index not ready
        const q = query(collection(db, 'adminRequests'), where('userId', '==', userId))
        snapshot = await getDocs(q)
      }

      if (snapshot.empty) return null
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return docs[0]
    } catch (error) {
      console.error('Error fetching user request:', error)
      return null
    }
  }

  // Get all admin requests (admin only)
  async getAllRequests() {
    try {
      const snapshot = await getDocs(collection(db, 'adminRequests'))
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      console.error('Error fetching admin requests:', error)
      return []
    }
  }

  // Approve a request and upgrade the user's role to admin
  async approveRequest(requestId, reviewNote = '') {
    try {
      const reviewerId = auth.currentUser?.uid
      if (!reviewerId) throw new Error('Not authenticated')

      const docRef = doc(db, 'adminRequests', requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Request not found')

      const request = snap.data()

      await updateDoc(docRef, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        reviewNote
      })

      // Promote user to admin
      const userRef = doc(db, 'users', request.userId)
      await updateDoc(userRef, {
        role: 'admin',
        updatedAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Error approving admin request:', error)
      throw new Error('Failed to approve request')
    }
  }

  // Reject a request
  async rejectRequest(requestId, reviewNote = '') {
    try {
      const reviewerId = auth.currentUser?.uid
      if (!reviewerId) throw new Error('Not authenticated')

      const docRef = doc(db, 'adminRequests', requestId)
      await updateDoc(docRef, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        reviewNote
      })

      return { success: true }
    } catch (error) {
      console.error('Error rejecting admin request:', error)
      throw new Error('Failed to reject request')
    }
  }
}

export default new AdminRequestService()
