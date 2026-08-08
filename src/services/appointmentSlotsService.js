import { collection, doc, getDoc, setDoc, updateDoc, deleteField, onSnapshot, query, where, documentId } from 'firebase/firestore'
import { db } from '../config/firebase'

// Firestore collection: appointmentSlots/{date}  (date = 'YYYY-MM-DD')
// Stores ONLY which time slots are currently booked on a given date — no
// resident names, symptoms, AI notes, or any other health_requests fields.
// This exists so the "check availability" calendar in ScheduleCheckupModal
// never has to query the health_requests collection itself (which contains
// sensitive per-resident health data): residents only ever read this
// privacy-safe collection, mirroring the purokStatsService pattern already
// used for health dashboard stats.
const COLLECTION = 'appointmentSlots'

// A request only blocks its slot while it's still "in play" — once a BHW
// rejects it or marks it completed, the slot frees back up for others.
// (Single source of truth — also imported by healthService/bhwService.)
export const ACTIVE_STATUSES = ['pending_review', 'scheduled', 'inreview']

const _ref = (date) => doc(db, COLLECTION, date)

class AppointmentSlotsService {
  // Real-time list of booked times per date within [startDate, endDate].
  // callback receives { '2026-08-10': Set(['09:00','14:00']), ... }
  subscribeToBookedRange(startDate, endDate, callback) {
    const q = query(
      collection(db, COLLECTION),
      where(documentId(), '>=', startDate),
      where(documentId(), '<=', endDate)
    )
    return onSnapshot(
      q,
      (snapshot) => {
        const map = {}
        snapshot.docs.forEach((docSnap) => {
          const times = docSnap.data()?.times || {}
          const active = Object.keys(times).filter((t) => times[t])
          if (active.length) map[docSnap.id] = new Set(active)
        })
        callback(map)
      },
      (error) => {
        console.error('Error subscribing to appointment slot availability:', error)
        callback({})
      }
    )
  }

  // One-time check used as a last-moment guard right before submitting.
  async isTimeBooked(date, time) {
    try {
      const snap = await getDoc(_ref(date))
      return Boolean(snap.exists() && snap.data()?.times?.[time])
    } catch (error) {
      console.error('Error checking appointment slot:', error)
      return false
    }
  }

  async addBooking(date, time) {
    try {
      if (!date || !time) return
      const ref = _ref(date)
      await setDoc(ref, { date }, { merge: true })
      await updateDoc(ref, { [`times.${time}`]: true, updatedAt: new Date().toISOString() })
    } catch (error) {
      console.error('Error adding appointment slot booking:', error)
    }
  }

  async removeBooking(date, time) {
    try {
      if (!date || !time) return
      const ref = _ref(date)
      await updateDoc(ref, { [`times.${time}`]: deleteField(), updatedAt: new Date().toISOString() })
    } catch (error) {
      console.error('Error removing appointment slot booking:', error)
    }
  }
}

export default new AppointmentSlotsService()
