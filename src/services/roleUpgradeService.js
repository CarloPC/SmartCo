
import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, query, where, orderBy
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

// Roles a resident is allowed to request via the Role Upgrade flow.
// Kept in one place so the form dropdown, submit validation, and approval
// logic can never drift out of sync with each other.
export const REQUESTABLE_ROLES = [
  { value: 'barangay_official', label: 'Barangay Official' },
  { value: 'bhw', label: 'Barangay Health Worker (BHW)' }
]

export const getRoleLabel = (value) =>
  REQUESTABLE_ROLES.find(r => r.value === value)?.label || value

// NOTE ON MIGRATION: This service intentionally reuses the existing
// `adminRequests` Firestore collection (previously used for the old
// "Request Admin Access" feature) instead of creating a brand-new
// collection, per the refactor requirements. Older documents in that
// collection won't have the newer fields (requestedRole, position,
// proofFileUrl, proofFileName, notes, submittedAt, remarks) — every read
// path below runs documents through `normalizeRequest()` so old and new
// requests render correctly in the same UI without a manual data migration.
class RoleUpgradeService {
  // Backward-compatible read shim for legacy adminRequests documents.
  normalizeRequest(raw) {
    return {
      requestedRole: raw.requestedRole || 'barangay_official', // legacy docs were always "become admin"
      position: raw.position || raw.currentRole || '',
      notes: raw.notes || '',
      proofFileUrl: raw.proofFileUrl || null,
      proofFileName: raw.proofFileName || null,
      submittedAt: raw.submittedAt || raw.createdAt,
      remarks: raw.remarks ?? raw.reviewNote ?? '',
      ...raw
    }
  }

  // Submit a new role upgrade request
  async submitRequest(data) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('Not authenticated')

      if (!REQUESTABLE_ROLES.some(r => r.value === data.requestedRole)) {
        return { success: false, error: 'Please select a valid role to request.' }
      }
      if (!data.proofFileUrl) {
        return { success: false, error: 'A supporting document is required.' }
      }

      // Prevent duplicate pending requests
      const existing = await this.getUserRequest(userId)
      if (existing && existing.status === 'pending') {
        return { success: false, error: 'You already have a pending role upgrade request.' }
      }

      // Step 11 — Resubmission: a fresh request created right after a
      // rejected one is flagged so Admin can tell it apart from a
      // first-time application, without needing a separate history system.
      // The previous (rejected) document is left untouched in Firestore —
      // that's the rejection-reason history the resident just corrected.
      const isResubmission = existing?.status === 'rejected'

      const docRef = await addDoc(collection(db, 'adminRequests'), {
        userId,
        requestedRole: data.requestedRole,
        fullName: data.fullName || '',
        position: data.position || '',
        reason: data.reason || '',
        notes: data.notes || '',
        proofFileUrl: data.proofFileUrl,
        proofFileName: data.proofFileName || '',
        email: data.email || '',
        purok: data.purok || '',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        // Legacy alias — kept so any older code/reports still reading
        // `createdAt` on this collection keep working.
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        remarks: '',
        isResubmission,
        previousRequestId: isResubmission ? existing.id : null,
      })

      await this.notifyAdmins(data)

      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Error submitting role upgrade request:', error)
      return { success: false, error: error.message }
    }
  }

  // Notify every admin that a new role upgrade request came in.
  // Failure here should never block the request submission itself.
  async notifyAdmins(data) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'))
      const snapshot = await getDocs(q)
      const roleLabel = getRoleLabel(data.requestedRole)
      await Promise.all(
        snapshot.docs.map(adminDoc =>
          notificationService.createNotification({
            userId: adminDoc.id,
            type: 'info',
            category: 'role_upgrade',
            message: `${data.fullName || 'A resident'} requested to become a ${roleLabel}.`,
            relatedType: 'roleUpgradeRequest'
          })
        )
      )
    } catch (error) {
      console.error('Error notifying admins of role upgrade request:', error)
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
          orderBy('submittedAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch {
        // Fallback without orderBy if the composite index isn't ready yet
        const q = query(collection(db, 'adminRequests'), where('userId', '==', userId))
        snapshot = await getDocs(q)
      }

      if (snapshot.empty) return null
      const docs = snapshot.docs.map(d => this.normalizeRequest({ id: d.id, ...d.data() }))
      docs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      return docs[0]
    } catch (error) {
      console.error('Error fetching user role upgrade request:', error)
      return null
    }
  }

  // Get all role upgrade requests (admin only)
  async getAllRequests() {
    try {
      const snapshot = await getDocs(collection(db, 'adminRequests'))
      return snapshot.docs
        .map(d => this.normalizeRequest({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    } catch (error) {
      console.error('Error fetching role upgrade requests:', error)
      return []
    }
  }

  // Approve a request and upgrade the user's role. Never creates a new
  // user document — only updates the existing users/{uid} record.
  async approveRequest(requestId, remarks = '') {
    try {
      const reviewerId = auth.currentUser?.uid
      if (!reviewerId) throw new Error('Not authenticated')

      const docRef = doc(db, 'adminRequests', requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Request not found')

      const request = this.normalizeRequest(snap.data())
      const newRole = REQUESTABLE_ROLES.some(r => r.value === request.requestedRole)
        ? request.requestedRole
        : 'barangay_official' // legacy fallback for pre-refactor "admin access" requests

      // Promote the user FIRST. Only Firestore's `isSuperAdmin()` rule can
      // write users/{uid}.role, which is stricter than who can reach this
      // page (AdminRoute also allows barangay_official/bhw). Doing this
      // write first — and only marking the request "approved" if it
      // succeeds — avoids ending up with a request stuck showing
      // "approved" while the user's role never actually changed.
      const userRef = doc(db, 'users', request.userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      })

      await updateDoc(docRef, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        remarks
      })

      await notificationService.createNotification({
        userId: request.userId,
        type: 'success',
        category: 'role_upgrade',
        message: `Congratulations! Your role has been upgraded to ${getRoleLabel(newRole)}.`,
        relatedId: requestId,
        relatedType: 'roleUpgradeRequest'
      })

      return { success: true }
    } catch (error) {
      console.error('Error approving role upgrade request:', error)
      throw new Error('Failed to approve request')
    }
  }

  // Reject a request. `remarks` (the rejection reason) is REQUIRED — Step 11
  // requires the applicant to always receive an explanation, never a bare
  // rejection. Enforced here too (not just in the UI) as defense in depth.
  async rejectRequest(requestId, remarks = '') {
    if (!remarks || !remarks.trim()) {
      throw new Error('Please provide a reason for rejecting this application.')
    }
    try {
      const reviewerId = auth.currentUser?.uid
      if (!reviewerId) throw new Error('Not authenticated')

      const docRef = doc(db, 'adminRequests', requestId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Request not found')
      const request = this.normalizeRequest(snap.data())

      await updateDoc(docRef, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        remarks
      })

      await notificationService.createNotification({
        userId: request.userId,
        type: 'error',
        category: 'role_upgrade',
        message: `Your request to become a ${getRoleLabel(request.requestedRole)} has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
        relatedId: requestId,
        relatedType: 'roleUpgradeRequest'
      })

      return { success: true }
    } catch (error) {
      console.error('Error rejecting role upgrade request:', error)
      throw new Error('Failed to reject request')
    }
  }
}

export default new RoleUpgradeService()
