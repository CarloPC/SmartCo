import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, onSnapshot
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'
import { PUROKS_ILIHAN, getShortPurokName } from '../constants/puroks'

// ── Distribution Workflow ─────────────────────────────────────────────────
// Pending Approval → Approved → AI Schedule Generated → Volunteer Assigned →
// Distribution Started → In Progress → Completed → Archived
// ('cancelled' is a lateral terminal state, reachable from any pre-completion stage)
export const WORKFLOW_STAGES = [
  'pending_approval',
  'approved',
  'ai_scheduled',
  'volunteer_assigned',
  'distribution_started',
  'in_progress',
  'completed',
  'archived',
]

export const WORKFLOW_LABELS = {
  pending_approval:     'Pending Approval',
  approved:             'Approved',
  ai_scheduled:         'AI Schedule Generated',
  volunteer_assigned:   'Volunteer Assigned',
  distribution_started: 'Distribution Started',
  in_progress:          'In Progress',
  completed:            'Completed',
  archived:             'Archived',
  cancelled:            'Cancelled',
}

/**
 * Back-compat: older docs (created before this workflow existed) won't have a
 * `workflowStatus` field. Derive a reasonable stage from the legacy
 * `status` / `approvalStatus` fields so nothing already saved in Firestore breaks.
 */
function deriveWorkflowStatus(d) {
  if (d.workflowStatus) return d.workflowStatus
  if (d.approvalStatus === 'pending')  return 'pending_approval'
  if (d.approvalStatus === 'rejected') return 'cancelled'

  const s = (d.status || 'scheduled').toLowerCase().replace(/\s+/g, '-')
  if (s === 'completed')    return 'completed'
  if (s === 'in-progress')  return 'in_progress'
  if (d.assignedVolunteer)  return 'volunteer_assigned'
  if (d.aiRecommendation)   return 'ai_scheduled'
  return 'approved'
}

/**
 * Calculate live distribution progress from actual data.
 * progress = householdsCompleted / householdsTarget × 100
 * Falls back to legacy `deliveredFamilies` / `totalFamilies` fields so old docs still work.
 */
export function calculateProgress(dist) {
  const target    = dist.householdsTarget ?? dist.totalFamilies ?? 0
  const completed = dist.householdsCompleted ?? dist.deliveredFamilies ?? 0
  const percentage = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

  return {
    percentage,
    householdsServed:    completed,
    householdsRemaining: Math.max(0, target - completed),
    householdsTarget:    target,
    workflowStatus:       deriveWorkflowStatus(dist),
  }
}

class FoodAidService {
  // ── Public: all schedules visible to every authenticated user ──────────
  async getAllFoodAidSchedules() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      return snapshot.docs.map(doc => this._enrich({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching all food aid schedules:', error)
      return []
    }
  }

  // Attach derived, always-up-to-date progress + workflow info without mutating Firestore
  _enrich(dist) {
    return { ...dist, progress: calculateProgress(dist) }
  }

  // ── Real-time subscriptions ─────────────────────────────────────────────
  /**
   * Subscribe to all food aid distributions in real time. Returns an unsubscribe fn.
   * Use in a component's useEffect, e.g.:
   *   useEffect(() => foodAidService.subscribeToFoodAid(setDistributions), [])
   */
  subscribeToFoodAid(callback) {
    return onSnapshot(collection(db, 'foodAid'), snapshot => {
      const items = snapshot.docs.map(doc => this._enrich({ id: doc.id, ...doc.data() }))
      callback(items)
    }, error => {
      console.error('Error in food aid real-time listener:', error)
      callback([])
    })
  }

  /**
   * Subscribe to distributions assigned to a specific volunteer in real time.
   */
  subscribeToVolunteerAssignments(volunteerId, callback) {
    const q = query(collection(db, 'foodAid'), where('assignedVolunteer.id', '==', volunteerId))
    return onSnapshot(q, snapshot => {
      const items = snapshot.docs.map(doc => this._enrich({ id: doc.id, ...doc.data() }))
      callback(items)
    }, error => {
      console.error('Error in volunteer assignment listener:', error)
      callback([])
    })
  }

  // ── Admin / Barangay Official: post a public distribution event ────────
  async postDistribution(distributionData) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const now = new Date().toISOString()
      const householdsTarget = distributionData.totalFamilies || distributionData.householdsTarget || 0

      const newDist = {
        ...distributionData,
        status:         'scheduled',
        approvalStatus: 'approved',
        workflowStatus: 'approved',
        deliveredFamilies:   0,
        householdsTarget,
        householdsCompleted: 0,
        assignedVolunteer:   null,
        estimatedCompletion: distributionData.date || null,
        completedAt:         null,
        remarks:             distributionData.remarks || '',
        aiRecommendation:    null,
        timeline: {
          createdAt:  now,
          approvedAt: now,
        },
        isPublicPost:   true,
        createdBy:      userId,
        createdAt:      now,
        updatedAt:      now,
      }

      const docRef = await addDoc(collection(db, 'foodAid'), newDist)
      const savedDist = { id: docRef.id, ...newDist }
      await this._createFoodAidNotification(savedDist, 'scheduled')
      // Notify residents in the target area (best-effort, non-blocking)
      this._notifyAreaResidents(distributionData.barangay, distributionData.purok, savedDist)
      return { success: true, ...savedDist }
    } catch (error) {
      console.error('Error posting distribution:', error)
      throw new Error('Failed to post distribution')
    }
  }

  // Broadcast a food aid notification to all residents of a specific purok/barangay
  async _notifyAreaResidents(barangay, purok, distData) {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      const currentUserId = auth.currentUser?.uid

      // Match residents by purok first; if no purok stored, match all non-admins
      let targets = allUsers.filter(u =>
        u.id !== currentUserId &&
        u.role !== 'admin' &&
        u.role !== 'barangay_official' &&
        (purok ? u.purok === purok : true)
      )

      // If no exact purok matches, fall back to notifying all residents
      if (targets.length === 0) {
        targets = allUsers.filter(u =>
          u.id !== currentUserId &&
          u.role !== 'admin' &&
          u.role !== 'barangay_official'
        )
      }

      const areaLabel = [purok, barangay].filter(Boolean).join(', ') || 'your area'
      const message = `🍱 Food Aid Alert: Distribution scheduled at ${areaLabel} on ${distData.date} (${distData.timeSlot || 'Morning'}). ${distData.totalFamilies} families will be served. Open the Food Aid page to view the route and track progress.`

      await Promise.all(
        targets.map(u =>
          notificationService.createNotification({
            userId:    u.id,
            type:      'info',
            category:  'foodaid',
            message,
            relatedId: distData.id,
          })
        )
      )
    } catch (err) {
      console.error('Error notifying area residents:', err)
      // fail silently — notification is best-effort
    }
  }

  async getFoodAidSchedules() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for food aid schedules')
        return []
      }

      const q = query(
        collection(db, 'foodAid'),
        where('createdBy', '==', userId)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => this._enrich({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching food aid schedules:', error)
      return []
    }
  }

  // All food aid distribution docs for a given purok, visible to every
  // resident of that purok. No privacy concern here — Firestore rules
  // already let any authenticated user read the whole `foodAid` collection,
  // so this is a plain filtered query, not an aggregate rollup.
  async getFoodAidByPurok(purok) {
    try {
      if (!purok) return []
      const shortLabel = getShortPurokName(purok)
      const snapshot = await getDocs(collection(db, 'foodAid'))
      return snapshot.docs
        .map(doc => this._enrich({ id: doc.id, ...doc.data() }))
        .filter(item => item.purok === purok || item.purok === shortLabel || getShortPurokName(item.purok) === shortLabel)
    } catch (error) {
      console.error('Error fetching food aid by purok:', error)
      return []
    }
  }

  async getFoodAidById(id) {
    try {
      const docRef = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return this._enrich({ id: docSnap.id, ...docSnap.data() })
      }
      return null
    } catch (error) {
      console.error('Error fetching food aid schedule:', error)
      return null
    }
  }

  async createFoodAidSchedule(scheduleData) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const now = new Date().toISOString()
      const householdsTarget = scheduleData.totalFamilies || scheduleData.householdsTarget || 0

      const newSchedule = {
        ...scheduleData,
        status: 'scheduled',
        deliveredFamilies: 0,
        approvalStatus: 'pending',
        workflowStatus: 'pending_approval',
        householdsTarget,
        householdsCompleted: 0,
        assignedVolunteer:   null,
        estimatedCompletion: scheduleData.date || null,
        completedAt:         null,
        remarks:             scheduleData.remarks || '',
        aiRecommendation:    null,
        timeline: { createdAt: now },
        createdBy: userId,
        createdAt: now,
        updatedAt: now
      }

      const docRef = await addDoc(collection(db, 'foodAid'), newSchedule)
      const schedule = { id: docRef.id, ...newSchedule }

      // Create notification
      await this._createFoodAidNotification(schedule, 'scheduled')

      return { success: true, schedule }
    } catch (error) {
      console.error('Error creating food aid schedule:', error)
      throw new Error('Failed to create food aid schedule')
    }
  }

  async updateFoodAidSchedule(id, updates) {
    try {
      const docRef = doc(db, 'foodAid', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error updating food aid schedule:', error)
      throw new Error('Food aid schedule not found')
    }
  }

  async updateDeliveryStatus(id, deliveredCount) {
    // Kept for backward compatibility — now delegates to updateHouseholdProgress
    return this.updateHouseholdProgress(id, deliveredCount)
  }

  async deleteFoodAidSchedule(id) {
    try {
      await deleteDoc(doc(db, 'foodAid', id))
      return { success: true }
    } catch (error) {
      console.error('Error deleting food aid schedule:', error)
      throw new Error('Food aid schedule not found')
    }
  }

  // ── Workflow: Approval ───────────────────────────────────────────────────
  async approveDistribution(id, remarks = '') {
    try {
      const docRef = doc(db, 'foodAid', id)
      const now = new Date().toISOString()
      const docSnap = await getDoc(docRef)
      const timeline = { ...(docSnap.data()?.timeline || {}), approvedAt: now }

      await updateDoc(docRef, {
        approvalStatus: 'approved',
        workflowStatus: 'approved',
        remarks:        remarks || docSnap.data()?.remarks || '',
        timeline,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)
      const schedule = this._enrich({ id: updatedDoc.id, ...updatedDoc.data() })
      await this._createFoodAidNotification(schedule, 'approved')
      return { success: true, schedule }
    } catch (error) {
      console.error('Error approving distribution:', error)
      throw new Error('Failed to approve distribution')
    }
  }

  async rejectDistribution(id, remarks = '') {
    try {
      const docRef = doc(db, 'foodAid', id)
      const now = new Date().toISOString()
      await updateDoc(docRef, {
        approvalStatus: 'rejected',
        workflowStatus: 'cancelled',
        remarks,
        updatedAt: now,
      })
      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error rejecting distribution:', error)
      throw new Error('Failed to reject distribution')
    }
  }

  // ── Workflow: AI Scheduling ─────────────────────────────────────────────
  /**
   * Generate AI-assisted scheduling recommendations for a distribution.
   * Uses the same rule-based heuristic approach as OptimizeSchedulePage
   * (no external AI call — analyzes existing distribution history + purok
   * household targets already stored in Firestore).
   *
   * Recommends: priority puroks, suggested distribution order,
   * suggested schedule, estimated duration, estimated manpower.
   */
  async generateAISchedule(id) {
    try {
      const docRef  = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) throw new Error('Distribution not found')
      const dist = docSnap.data()

      const recommendation = await this._buildAIRecommendation(dist)
      const now = new Date().toISOString()
      const timeline = { ...(dist.timeline || {}), aiScheduledAt: now }

      await updateDoc(docRef, {
        aiRecommendation: recommendation,
        workflowStatus:   'ai_scheduled',
        estimatedCompletion: recommendation.suggestedSchedule?.[0]?.date || dist.date || null,
        timeline,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error generating AI schedule:', error)
      throw new Error('Failed to generate AI schedule')
    }
  }

  /** Builds the AI recommendation object from live Firestore distribution history. */
  async _buildAIRecommendation(dist) {
    const snapshot = await getDocs(collection(db, 'foodAid'))
    const history  = snapshot.docs.map(d => d.data())

    // Priority puroks: puroks (from the central Ilihan purok list) that have
    // gone the longest without a completed distribution, or have never had one.
    const lastServedByPurok = {}
    history.forEach(h => {
      const p = h.purok
      if (!p) return
      const completedAt = h.completedAt || (h.status === 'completed' ? h.updatedAt : null)
      if (completedAt && (!lastServedByPurok[p] || completedAt > lastServedByPurok[p])) {
        lastServedByPurok[p] = completedAt
      }
    })

    const priorityPuroks = [...PUROKS_ILIHAN]
      .map(p => ({ purok: p, shortLabel: getShortPurokName(p), lastServed: lastServedByPurok[p] || null }))
      .sort((a, b) => {
        if (!a.lastServed && !b.lastServed) return 0
        if (!a.lastServed) return -1
        if (!b.lastServed) return 1
        return a.lastServed.localeCompare(b.lastServed)
      })
      .slice(0, 3)
      .map(p => p.shortLabel)

    // Suggested distribution order: target purok first, then remaining priority puroks
    const suggestedOrder = [dist.purok, ...priorityPuroks.filter(p => p !== dist.purok)].filter(Boolean)

    // Suggested schedule: spread across consecutive days starting from the requested date
    const baseDate = dist.date ? new Date(dist.date) : new Date()
    const suggestedSchedule = suggestedOrder.map((purok, i) => {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      return { purok, date: d.toISOString().split('T')[0], timeSlot: i % 2 === 0 ? 'Morning (8AM-10AM)' : 'Afternoon (2PM-4PM)' }
    })

    // Manpower: ~1 volunteer per 15 households, minimum 2
    const householdsTarget = dist.householdsTarget || dist.totalFamilies || 0
    const estimatedManpower = Math.max(2, Math.ceil(householdsTarget / 15))

    // Duration: ~4 minutes per household + 30 min setup, in minutes
    const estimatedDuration = Math.round(householdsTarget * 4 + 30)

    return {
      priorityPuroks,
      suggestedOrder,
      suggestedSchedule,
      estimatedDuration,   // minutes
      estimatedManpower,   // volunteer count
      generatedAt: new Date().toISOString(),
    }
  }

  // ── Workflow: Volunteer Assignment ──────────────────────────────────────
  async assignVolunteer(id, volunteer) {
    try {
      if (!volunteer?.id || !volunteer?.name) throw new Error('Volunteer id and name are required')

      const docRef  = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) throw new Error('Distribution not found')

      const now = new Date().toISOString()
      const timeline = { ...(docSnap.data()?.timeline || {}), volunteerAssignedAt: now }

      await updateDoc(docRef, {
        assignedVolunteer: { id: volunteer.id, name: volunteer.name },
        workflowStatus:    'volunteer_assigned',
        timeline,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)
      const schedule = this._enrich({ id: updatedDoc.id, ...updatedDoc.data() })

      // Notify the assigned volunteer
      await notificationService.createNotification({
        userId:    volunteer.id,
        type:      'info',
        category:  'foodaid',
        message:   `You've been assigned to a food aid distribution in ${schedule.purok || schedule.barangay} on ${schedule.date}.`,
        relatedId: schedule.id,
      })

      return { success: true, schedule }
    } catch (error) {
      console.error('Error assigning volunteer:', error)
      throw new Error('Failed to assign volunteer')
    }
  }

  async unassignVolunteer(id) {
    try {
      const docRef = doc(db, 'foodAid', id)
      await updateDoc(docRef, {
        assignedVolunteer: null,
        workflowStatus:    'approved',
        updatedAt: new Date().toISOString(),
      })
      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error unassigning volunteer:', error)
      throw new Error('Failed to unassign volunteer')
    }
  }

  /** Get all distributions assigned to a given volunteer (one-time fetch). */
  async getVolunteerAssignments(volunteerId) {
    try {
      const q = query(collection(db, 'foodAid'), where('assignedVolunteer.id', '==', volunteerId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => this._enrich({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error fetching volunteer assignments:', error)
      return []
    }
  }

  // ── Workflow: Distribution Start / Progress / Completion ───────────────
  async startDistribution(id) {
    try {
      const docRef  = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) throw new Error('Distribution not found')

      const now = new Date().toISOString()
      const timeline = { ...(docSnap.data()?.timeline || {}), startedAt: now }

      await updateDoc(docRef, {
        workflowStatus: 'distribution_started',
        status:         'in-progress', // legacy field kept in sync
        timeline,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error starting distribution:', error)
      throw new Error('Failed to start distribution')
    }
  }

  /**
   * Update households served so far. Automatically transitions the workflow
   * status (in_progress → completed) based on progress vs. target, and
   * stamps the timeline/completedAt fields when finished.
   */
  async updateHouseholdProgress(id, householdsCompleted, remarks = '') {
    try {
      const docRef  = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) throw new Error('Food aid schedule not found')

      const dist   = docSnap.data()
      const target = dist.householdsTarget || dist.totalFamilies || 0
      const clamped = Math.max(0, Math.min(householdsCompleted, target || householdsCompleted))

      const now = new Date().toISOString()
      let workflowStatus = 'in_progress'
      let status         = 'in-progress' // legacy
      const timeline = { ...(dist.timeline || {}) }
      let completedAt = dist.completedAt || null

      if (target > 0 && clamped >= target) {
        workflowStatus = 'completed'
        status         = 'completed'
        completedAt    = now
        timeline.completedAt = now
      } else if (clamped > 0 && !timeline.startedAt) {
        timeline.startedAt = now
      }

      await updateDoc(docRef, {
        householdsCompleted: clamped,
        deliveredFamilies:   clamped, // legacy field kept in sync
        workflowStatus,
        status,
        completedAt,
        remarks: remarks || dist.remarks || '',
        timeline,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)
      const schedule = this._enrich({ id: updatedDoc.id, ...updatedDoc.data() })

      if (workflowStatus === 'completed') {
        await this._createFoodAidNotification(schedule, 'completed')
      }

      return { success: true, schedule }
    } catch (error) {
      console.error('Error updating household progress:', error)
      throw error
    }
  }

  async archiveDistribution(id) {
    try {
      const docRef  = doc(db, 'foodAid', id)
      const docSnap = await getDoc(docRef)
      const now = new Date().toISOString()
      const timeline = { ...(docSnap.data()?.timeline || {}), archivedAt: now }

      await updateDoc(docRef, {
        workflowStatus: 'archived',
        timeline,
        updatedAt: now,
      })
      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error archiving distribution:', error)
      throw new Error('Failed to archive distribution')
    }
  }

  async cancelDistribution(id, remarks = '') {
    try {
      const docRef = doc(db, 'foodAid', id)
      await updateDoc(docRef, {
        workflowStatus: 'cancelled',
        remarks,
        updatedAt: new Date().toISOString(),
      })
      const updatedDoc = await getDoc(docRef)
      return { success: true, schedule: this._enrich({ id: updatedDoc.id, ...updatedDoc.data() }) }
    } catch (error) {
      console.error('Error cancelling distribution:', error)
      throw new Error('Failed to cancel distribution')
    }
  }

  // ── Stats & Analytics ────────────────────────────────────────────────────
  async getFoodAidStats() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for food aid stats')
        return {
          total: 0, totalFamilies: 0, deliveredFamilies: 0, progress: 0,
          pending: 0, inProgress: 0, completed: 0
        }
      }

      const q = query(
        collection(db, 'foodAid'),
        where('createdBy', '==', userId)
      )
      const snapshot = await getDocs(q)
      const foodAid = snapshot.docs.map(doc => doc.data())

      const totalFamilies = foodAid.reduce((sum, item) => sum + (item.householdsTarget ?? item.totalFamilies ?? 0), 0)
      const deliveredFamilies = foodAid.reduce((sum, item) => sum + (item.householdsCompleted ?? item.deliveredFamilies ?? 0), 0)
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
    } catch (error) {
      console.error('Error fetching food aid stats:', error)
      return {
        total: 0, totalFamilies: 0, deliveredFamilies: 0, progress: 0,
        pending: 0, inProgress: 0, completed: 0
      }
    }
  }

  async getDistributionByPurok() {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.log('No authenticated user for distribution by purok')
        return []
      }

      const q = query(
        collection(db, 'foodAid'),
        where('createdBy', '==', userId)
      )
      const snapshot = await getDocs(q)
      const foodAid = snapshot.docs.map(doc => doc.data())
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

        purokData[item.purok].totalFamilies += (item.householdsTarget ?? item.totalFamilies ?? 0)
        purokData[item.purok].deliveredFamilies += (item.householdsCompleted ?? item.deliveredFamilies ?? 0)
        purokData[item.purok].schedules += 1
      })

      return Object.values(purokData)
    } catch (error) {
      console.error('Error fetching distribution by purok:', error)
      return []
    }
  }

  /**
   * Barangay-wide dashboard analytics (all distributions, not just the
   * current user's), computed live from Firestore for the Distribution
   * Analytics dashboard: workflow-stage counts, household totals,
   * progress by purok, and volunteer performance.
   */
  async getDashboardAnalytics() {
    try {
      const snapshot = await getDocs(collection(db, 'foodAid'))
      const all = snapshot.docs.map(d => this._enrich({ id: d.id, ...d.data() }))

      const byStage = {}
      WORKFLOW_STAGES.concat('cancelled').forEach(s => { byStage[s] = 0 })
      all.forEach(d => { byStage[d.progress.workflowStatus] = (byStage[d.progress.workflowStatus] || 0) + 1 })

      const totalHouseholds   = all.reduce((s, d) => s + d.progress.householdsTarget, 0)
      const householdsServed  = all.reduce((s, d) => s + d.progress.householdsServed, 0)
      const householdsRemaining = Math.max(0, totalHouseholds - householdsServed)

      // Progress by purok (uses the central Ilihan purok list so every purok shows up, even with 0 activity)
      const progressByPurok = PUROKS_ILIHAN.map(purok => {
        const shortLabel = getShortPurokName(purok)
        const items = all.filter(d => d.purok === purok || d.purok === shortLabel)
        const target = items.reduce((s, d) => s + d.progress.householdsTarget, 0)
        const served = items.reduce((s, d) => s + d.progress.householdsServed, 0)
        return {
          purok: shortLabel,
          distributions: items.length,
          householdsTarget: target,
          householdsServed: served,
          percentage: target > 0 ? Math.round((served / target) * 100) : 0,
        }
      })

      // Volunteer performance
      const volunteerMap = {}
      all.forEach(d => {
        const v = d.assignedVolunteer
        if (!v?.id) return
        if (!volunteerMap[v.id]) {
          volunteerMap[v.id] = { id: v.id, name: v.name, assigned: 0, completed: 0, householdsServed: 0 }
        }
        volunteerMap[v.id].assigned += 1
        volunteerMap[v.id].householdsServed += d.progress.householdsServed
        if (d.progress.workflowStatus === 'completed') volunteerMap[v.id].completed += 1
      })

      return {
        totalDistributions: all.length,
        pending:    byStage.pending_approval,
        approved:   byStage.approved,
        scheduled:  byStage.ai_scheduled,
        inProgress: byStage.in_progress + byStage.distribution_started,
        completed:  byStage.completed,
        cancelled:  byStage.cancelled,
        archived:   byStage.archived,
        totalHouseholds,
        householdsServed,
        householdsRemaining,
        progressByPurok,
        volunteerPerformance: Object.values(volunteerMap).sort((a, b) => b.completed - a.completed),
      }
    } catch (error) {
      console.error('Error computing dashboard analytics:', error)
      return {
        totalDistributions: 0, pending: 0, approved: 0, scheduled: 0, inProgress: 0,
        completed: 0, cancelled: 0, archived: 0, totalHouseholds: 0, householdsServed: 0,
        householdsRemaining: 0, progressByPurok: [], volunteerPerformance: [],
      }
    }
  }

  async _createFoodAidNotification(schedule, action) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      let message = ''
      if (action === 'scheduled') {
        message = `Food aid scheduled for ${schedule.purok} on ${schedule.date}`
      } else if (action === 'approved') {
        message = `Food aid distribution for ${schedule.purok} was approved`
      } else if (action === 'completed') {
        message = `Food aid distribution completed for ${schedule.purok}`
      }

      await notificationService.createNotification({
        userId,
        type: 'info',
        category: 'foodaid',
        message,
        relatedId: schedule.id
      })
    } catch (error) {
      console.error('Error creating food aid notification:', error)
    }
  }
}

export default new FoodAidService()