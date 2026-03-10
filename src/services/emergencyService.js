import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc,
  query, where, orderBy
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class EmergencyService {
  // Report a new emergency (resident)
  async reportEmergency(data) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const emergency = {
        userId,
        reporterName: data.reporterName || '',
        reporterPhone: data.reporterPhone || '',
        type: data.type,
        purok: data.purok,
        location: data.location || '',
        description: data.description,
        severity: data.severity || 'medium',
        coords: data.coords || null,
        status: 'pending',
        tanodDispatched: false,
        tanodInfo: null,
        respondedBy: null,
        respondedAt: null,
        responseNote: '',
        rejectedBy: null,
        rejectionReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, 'emergencies'), emergency)

      await this._notifyAdminsAndOfficials({
        message: `🚨 Emergency reported in ${data.purok}: ${data.type} — ${data.description?.slice(0, 80)}`,
        relatedId: docRef.id,
        category: 'emergency',
        type: 'emergency',
      })

      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Error reporting emergency:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all emergencies (admin/official)
  async getEmergencies() {
    try {
      let snapshot
      try {
        const q = query(collection(db, 'emergencies'), orderBy('createdAt', 'desc'))
        snapshot = await getDocs(q)
      } catch {
        snapshot = await getDocs(collection(db, 'emergencies'))
      }
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      console.error('Error fetching emergencies:', error)
      return []
    }
  }

  // Get emergencies reported by current user (resident)
  async getMyEmergencies() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return []
      const q = query(
        collection(db, 'emergencies'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (error) {
      console.error('Error fetching my emergencies:', error)
      return []
    }
  }

  // Answer / set active (admin/official)
  async respondToEmergency(emergencyId, responseNote = '') {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = doc(db, 'emergencies', emergencyId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Emergency not found')
      const emergency = snap.data()

      await updateDoc(docRef, {
        status: 'active',
        respondedBy: userId,
        respondedAt: new Date().toISOString(),
        responseNote,
        updatedAt: new Date().toISOString(),
      })

      if (emergency.userId) {
        await notificationService.createNotification({
          userId: emergency.userId,
          type: 'info',
          category: 'emergency',
          message: `✅ Your emergency report (${emergency.type} in ${emergency.purok}) has been responded to. Help is on the way!`,
          relatedId: emergencyId,
          relatedType: 'emergency',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error responding to emergency:', error)
      return { success: false, error: error.message }
    }
  }

  // Reject emergency (admin/official)
  async rejectEmergency(emergencyId, reason = '') {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = doc(db, 'emergencies', emergencyId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Emergency not found')
      const emergency = snap.data()

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      })

      if (emergency.userId) {
        const msg = reason
          ? `❌ Your emergency report (${emergency.type} in ${emergency.purok}) was rejected. Reason: ${reason}`
          : `❌ Your emergency report (${emergency.type} in ${emergency.purok}) has been rejected.`
        await notificationService.createNotification({
          userId: emergency.userId,
          type: 'error',
          category: 'emergency',
          message: msg,
          relatedId: emergencyId,
          relatedType: 'emergency',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error rejecting emergency:', error)
      return { success: false, error: error.message }
    }
  }

  // Dispatch tanod (admin/official)
  async dispatchTanod(emergencyId, { tanodName, tanodNote }) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = doc(db, 'emergencies', emergencyId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Emergency not found')
      const emergency = snap.data()

      await updateDoc(docRef, {
        tanodDispatched: true,
        tanodInfo: {
          tanodName,
          tanodNote,
          dispatchedBy: userId,
          dispatchedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      })

      if (emergency.userId) {
        await notificationService.createNotification({
          userId: emergency.userId,
          type: 'success',
          category: 'emergency',
          message: `🛡️ Tanod "${tanodName}" has been dispatched to ${emergency.purok} for your emergency report.`,
          relatedId: emergencyId,
          relatedType: 'emergency',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error dispatching tanod:', error)
      return { success: false, error: error.message }
    }
  }

  // Mark as resolved (admin/official)
  async resolveEmergency(emergencyId) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = doc(db, 'emergencies', emergencyId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Emergency not found')
      const emergency = snap.data()

      await updateDoc(docRef, {
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      if (emergency.userId) {
        await notificationService.createNotification({
          userId: emergency.userId,
          type: 'success',
          category: 'emergency',
          message: `✅ Your emergency report (${emergency.type} in ${emergency.purok}) has been resolved. Thank you.`,
          relatedId: emergencyId,
          relatedType: 'emergency',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error resolving emergency:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── FAKE REPORT + SUSPENSION ──────────────────────────────────────────────

  /**
   * Mark emergency as fake and suspend the reporter.
   * @param {string} emergencyId
   * @param {{ isPermanent: boolean, suspendUntil: string|null, reason: string }} opts
   */
  async markAsFake(emergencyId, { isPermanent, suspendUntil, reason }) {
    try {
      const adminId = auth.currentUser?.uid
      if (!adminId) throw new Error('User not authenticated')

      const docRef = doc(db, 'emergencies', emergencyId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) throw new Error('Emergency not found')
      const emergency = snap.data()

      // Update emergency status
      await updateDoc(docRef, {
        status: 'fake',
        markedFakeBy: adminId,
        markedFakeAt: new Date().toISOString(),
        fakeReason: reason || '',
        updatedAt: new Date().toISOString(),
      })

      // Suspend the reporter's account
      if (emergency.userId) {
        const userRef = doc(db, 'users', emergency.userId)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.exists() ? userSnap.data() : {}
        const suspensionCount = (userData.emergencySuspensionCount || 0) + 1

        await updateDoc(userRef, {
          emergencySuspended: true,
          emergencySuspendedUntil: isPermanent ? null : (suspendUntil || null),
          emergencySuspensionReason: reason || 'Filing a false emergency report',
          emergencySuspensionCount: suspensionCount,
          emergencySuspendedAt: new Date().toISOString(),
          emergencySuspendedBy: adminId,
          updatedAt: new Date().toISOString(),
        })

        // Build notification — escalate on repeat offenses
        const endStr = isPermanent
          ? 'permanently'
          : `until ${new Date(suspendUntil).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`

        let notifMsg
        if (suspensionCount >= 2) {
          notifMsg = `🚫 SERIOUS WARNING — Offense #${suspensionCount}: Your emergency report has been verified as FAKE. ` +
            `Your emergency reporting access is suspended ${endStr}. ` +
            `Continued abuse of the emergency reporting system may result in PERMANENT account termination ` +
            `and you will be summoned to the Barangay Hall for a formal hearing.`
        } else {
          notifMsg = `⚠️ WARNING: Your emergency report has been verified as FAKE by barangay officials. ` +
            `Your emergency reporting access has been suspended ${endStr}. ` +
            `Reason: ${reason || 'Filing a false emergency report'}. ` +
            `Please note that repeated violations may lead to account termination and a formal summons to the Barangay Hall.`
        }

        await notificationService.createNotification({
          userId: emergency.userId,
          type: 'error',
          category: 'emergency',
          message: notifMsg,
          relatedId: emergencyId,
          relatedType: 'emergency',
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking as fake:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if the current (or given) user is suspended from reporting.
   * Auto-clears expired suspensions.
   */
  async checkUserSuspension(userId) {
    try {
      const uid = userId || auth.currentUser?.uid
      if (!uid) return { suspended: false }

      const userRef = doc(db, 'users', uid)
      const snap = await getDoc(userRef)
      if (!snap.exists()) return { suspended: false }

      const data = snap.data()
      if (!data.emergencySuspended) return { suspended: false }

      // Auto-clear if time-limited suspension has expired
      if (data.emergencySuspendedUntil) {
        const until = new Date(data.emergencySuspendedUntil)
        if (until <= new Date()) {
          await updateDoc(userRef, {
            emergencySuspended: false,
            updatedAt: new Date().toISOString(),
          })
          return { suspended: false }
        }
      }

      return {
        suspended: true,
        isPermanent: !data.emergencySuspendedUntil,
        suspendedUntil: data.emergencySuspendedUntil || null,
        reason: data.emergencySuspensionReason || '',
        count: data.emergencySuspensionCount || 1,
        suspendedAt: data.emergencySuspendedAt || null,
      }
    } catch (error) {
      console.error('Error checking suspension:', error)
      return { suspended: false }
    }
  }

  /**
   * Lift a user's emergency reporting suspension (admin/official).
   */
  async liftSuspension(userId) {
    try {
      const adminId = auth.currentUser?.uid
      if (!adminId) throw new Error('User not authenticated')

      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        emergencySuspended: false,
        emergencySuspendedUntil: null,
        updatedAt: new Date().toISOString(),
      })

      await notificationService.createNotification({
        userId,
        type: 'success',
        category: 'emergency',
        message: '✅ Your emergency reporting suspension has been lifted by barangay officials. You may now report emergencies again. Please use this privilege responsibly.',
        relatedType: 'emergency',
      })

      return { success: true }
    } catch (error) {
      console.error('Error lifting suspension:', error)
      return { success: false, error: error.message }
    }
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  async _notifyAdminsAndOfficials({ message, relatedId, category, type }) {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const admins = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.role === 'admin' || u.role === 'barangay_official')

      await Promise.all(
        admins.map(admin =>
          notificationService.createNotification({
            userId: admin.id,
            type,
            category,
            message,
            relatedId,
            relatedType: 'emergency',
          })
        )
      )
    } catch (error) {
      console.error('Error notifying admins:', error)
    }
  }
}

export default new EmergencyService()
