
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc,
  query, where, orderBy, onSnapshot
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

const COLLECTION = 'documentRequests'

class DocumentRequestService {
  // ─── Resident: submit a new document request ─────────────────────────────
  async submitRequest(data) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const request = {
        userId,
        residentName: data.residentName || '',
        residentEmail: data.residentEmail || '',
        residentPhone: data.residentPhone || '',
        purok: data.purok || '',
        documentType: data.documentType,
        otherDocument: data.documentType === 'Other' ? (data.otherDocument || '') : '',
        purpose: data.purpose || '',
        notes: data.notes || '',
        preferredClaimDate: data.preferredClaimDate || '',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        approvedAt: null,
        rejectedAt: null,
        completedAt: null,
        processedBy: null,
        remarks: '',
        notificationSent: false,
        updatedAt: new Date().toISOString(),
      }
      
      const docRef = await addDoc(collection(db, COLLECTION), request)
      await updateDoc(docRef, { requestId: docRef.id })

      const docLabel = data.documentType === 'Other' && data.otherDocument
        ? data.otherDocument
        : data.documentType

      const notifyResult = await this._notifyAdminsAndOfficials({
        message: `📄 New Document Request: ${data.residentName || 'A resident'} requested a ${docLabel}.`,
        relatedId: docRef.id,
        category: 'document',
        type: 'info',
      })

      if (notifyResult) {
        await updateDoc(docRef, { notificationSent: true })
      }

      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Error submitting document request:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── Resident: get only my own requests ───────────────────────────────────
  async getMyRequests() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return []
      let snapshot
      try {
        const q = query(
          collection(db, COLLECTION),
          where('userId', '==', userId),
          orderBy('requestedAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch {
        const q = query(collection(db, COLLECTION), where('userId', '==', userId))
        snapshot = await getDocs(q)
      }
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    } catch (error) {
      console.error('Error fetching my document requests:', error)
      return []
    }
  }

  // Live version of getMyRequests, for the resident "My Requests" view
  subscribeToMyRequests(callback) {
    const userId = auth.currentUser?.uid
    if (!userId) {
      callback([])
      return () => {}
    }
    const q = query(collection(db, COLLECTION), where('userId', '==', userId))
    return onSnapshot(q, snapshot => {
      const items = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      callback(items)
    }, error => {
      console.error('Error in my document requests listener:', error)
      callback([])
    })
  }

  // ─── Official/Admin: get all requests ─────────────────────────────────────
  async getAllRequests() {
    try {
      let snapshot
      try {
        const q = query(collection(db, COLLECTION), orderBy('requestedAt', 'desc'))
        snapshot = await getDocs(q)
      } catch {
        snapshot = await getDocs(collection(db, COLLECTION))
      }
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    } catch (error) {
      console.error('Error fetching document requests:', error)
      return []
    }
  }

  // Live version of getAllRequests, for the official management dashboard
  subscribeToAllRequests(callback) {
    return onSnapshot(collection(db, COLLECTION), snapshot => {
      const items = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      callback(items)
    }, error => {
      console.error('Error in document requests listener:', error)
      callback([])
    })
  }

  // ─── Official/Admin: approve a request ────────────────────────────────────
  async approveRequest(requestId, remarks = '') {
    try {
      const officialId = auth.currentUser?.uid
      if (!officialId) throw new Error('User not authenticated')

      const docRef = doc(db, COLLECTION, requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Document request not found')
      const request = snap.data()

      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        processedBy: officialId,
        remarks,
        updatedAt: new Date().toISOString(),
      })

      const docLabel = request.documentType === 'Other' && request.otherDocument
        ? request.otherDocument
        : request.documentType

      if (request.userId) {
        await notificationService.createNotification({
          userId: request.userId,
          type: 'success',
          category: 'document',
          message: remarks
            ? `✅ Your ${docLabel} request has been approved. ${remarks}`
            : `✅ Your ${docLabel} request has been approved.`,
          relatedId: requestId,
          relatedType: 'document',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error approving document request:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── Official/Admin: reject a request ─────────────────────────────────────
  async rejectRequest(requestId, remarks = '') {
    try {
      const officialId = auth.currentUser?.uid
      if (!officialId) throw new Error('User not authenticated')

      const docRef = doc(db, COLLECTION, requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Document request not found')
      const request = snap.data()

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        processedBy: officialId,
        remarks,
        updatedAt: new Date().toISOString(),
      })

      const docLabel = request.documentType === 'Other' && request.otherDocument
        ? request.otherDocument
        : request.documentType

      if (request.userId) {
        await notificationService.createNotification({
          userId: request.userId,
          type: 'error',
          category: 'document',
          message: remarks
            ? `❌ Your ${docLabel} request has been rejected. Reason: ${remarks}`
            : `❌ Your ${docLabel} request has been rejected.`,
          relatedId: requestId,
          relatedType: 'document',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error rejecting document request:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── Official/Admin: mark an approved request as completed / claimed ─────
  async markCompleted(requestId, remarks = '') {
    try {
      const officialId = auth.currentUser?.uid
      if (!officialId) throw new Error('User not authenticated')

      const docRef = doc(db, COLLECTION, requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Document request not found')
      const request = snap.data()

      await updateDoc(docRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        processedBy: officialId,
        remarks: remarks || request.remarks || '',
        updatedAt: new Date().toISOString(),
      })

      const docLabel = request.documentType === 'Other' && request.otherDocument
        ? request.otherDocument
        : request.documentType

      if (request.userId) {
        await notificationService.createNotification({
          userId: request.userId,
          type: 'success',
          category: 'document',
          message: `📄 Your ${docLabel} has been marked as claimed/completed. Thank you.`,
          relatedId: requestId,
          relatedType: 'document',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error completing document request:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── Dashboard analytics (for AdminDashboardPage + AI Decision Support) ──
  async getDashboardStats() {
    try {
      const all = await this.getAllRequests()
      const todayStr = new Date().toDateString()

      const pending = all.filter(r => r.status === 'pending')
      const approvedToday = all.filter(r => r.status === 'approved' && r.approvedAt && new Date(r.approvedAt).toDateString() === todayStr)
      const rejectedToday = all.filter(r => r.status === 'rejected' && r.rejectedAt && new Date(r.rejectedAt).toDateString() === todayStr)

      return {
        pending: pending.length,
        approvedToday: approvedToday.length,
        rejectedToday: rejectedToday.length,
        total: all.length,
        recent: all.slice(0, 5),
      }
    } catch (error) {
      console.error('Error computing document request stats:', error)
      return { pending: 0, approvedToday: 0, rejectedToday: 0, total: 0, recent: [] }
    }
  }

  // ─── Internal helper: notify all admins/barangay officials ───────────────
  // ─── Internal helper: notify all admins/barangay officials ─────────────────
// FIX: Query only for admin/barangay_official docs instead of fetching the
// whole `users` collection. The Firestore rule for `users`:
//
//   allow list: if isAdmin() || (isAuthenticated() &&
//     resource.data.role in ['bhw', 'admin', 'barangay_official']);
//
// is evaluated against EVERY document a query could return. An unfiltered
// collection(db, 'users') query tries to return every user, including plain
// residents whose role doesn't match — so the rule fails for those docs and
// Firestore denies the ENTIRE query for a non-admin caller (like the
// resident who just submitted the request). That's why officials/admins
// never got notified: this call was silently failing and being swallowed
// by the try/catch below.
//
// Adding the `where('role', 'in', [...])` filter means every doc the query
// can possibly return already satisfies the rule, so it succeeds for
// residents too.
async _notifyAdminsAndOfficials({ message, relatedId, category, type }) {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'barangay_official'])
    )
    const snapshot = await getDocs(q)
    const officials = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    await Promise.all(
      officials.map(o =>
        notificationService.createNotification({
          userId: o.id,
          type,
          category,
          message,
          relatedId,
          relatedType: 'document',
        })
      )
    )
    return true
  } catch (error) {
    console.error('Error notifying admins/officials of document request:', error)
    return false
  }
}
}

export default new DocumentRequestService()
