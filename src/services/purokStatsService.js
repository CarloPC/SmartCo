import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getShortPurokName } from '../constants/puroks'

// Firestore collection: purokStats/{purok}
// Stores ONLY non-sensitive aggregate counters per purok (no names, no
// vitals, no individual record data) so residents can see purok-wide stats
// without ever being granted read access to other residents' healthRecords.
const COLLECTION = 'purokStats'
const STATUS_BUCKETS = ['pending', 'approved', 'rejected']

const monthKey = (isoDate = new Date().toISOString()) => {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const emptyHealthStats = () => ({ total: 0, pending: 0, approved: 0, rejected: 0, monthly: {} })

class PurokStatsService {
  _ref(purok) {
    const id = getShortPurokName(purok) || 'Unassigned'
    return doc(db, COLLECTION, id)
  }

  // One-time fetch of a purok's health checkup stats.
  async getHealthStats(purok) {
    try {
      if (!purok) return emptyHealthStats()
      const snap = await getDoc(this._ref(purok))
      const health = snap.exists() ? snap.data().health : null
      return { ...emptyHealthStats(), ...(health || {}) }
    } catch (error) {
      console.error('Error fetching purok health stats:', error)
      return emptyHealthStats()
    }
  }

  // Real-time subscription — every resident in the purok sees the same
  // numbers update live, without re-fetching.
  subscribeToHealthStats(purok, callback) {
    if (!purok) {
      callback(emptyHealthStats())
      return () => {}
    }
    return onSnapshot(
      this._ref(purok),
      (snap) => {
        const health = snap.exists() ? snap.data().health : null
        callback({ ...emptyHealthStats(), ...(health || {}) })
      },
      (error) => {
        console.error('Error subscribing to purok health stats:', error)
        callback(emptyHealthStats())
      }
    )
  }

  // Call once, right after a resident submits a new health checkup.
  async recordHealthCreated(purok, createdAt = new Date().toISOString()) {
    try {
      if (!purok) return
      const ref = this._ref(purok)
      // Ensure the doc exists before incrementing nested fields on it.
      await setDoc(ref, { purok: getShortPurokName(purok) }, { merge: true })
      await updateDoc(ref, {
        'health.total': increment(1),
        'health.pending': increment(1),
        [`health.monthly.${monthKey(createdAt)}`]: increment(1),
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error recording purok health stat (created):', error)
    }
  }

  // Call whenever a health record's approvalStatus changes, e.g.
  // pending -> approved or pending -> rejected.
  async recordHealthStatusChange(purok, oldStatus, newStatus) {
    try {
      if (!purok || oldStatus === newStatus) return
      const ref = this._ref(purok)
      const updates = { updatedAt: new Date().toISOString() }
      if (STATUS_BUCKETS.includes(oldStatus)) updates[`health.${oldStatus}`] = increment(-1)
      if (STATUS_BUCKETS.includes(newStatus)) updates[`health.${newStatus}`] = increment(1)
      await setDoc(ref, { purok: getShortPurokName(purok) }, { merge: true })
      await updateDoc(ref, updates)
    } catch (error) {
      console.error('Error recording purok health stat (status change):', error)
    }
  }
}

export default new PurokStatsService()