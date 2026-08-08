
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import notificationService from './notificationService'
import purokStatsService from './purokStatsService'
import appointmentSlotsService, { ACTIVE_STATUSES } from './appointmentSlotsService'

const HEALTH_REQUESTS_COLLECTION = 'health_requests'

const enrichHealthRequests = async (requests) => {
  return Promise.all(requests.map(async (request) => {
    if (request.purok) return request

    if (request.sourceRecordId) {
      try {
        const recordSnap = await getDoc(doc(db, 'healthRecords', request.sourceRecordId))
        const record = recordSnap.data()
        if (record?.userPurok) {
          return {
            ...request,
            purok: record.userPurok,
            residentName: request.residentName || record.userName || 'Resident',
          }
        }
      } catch (error) {
        console.warn('Could not load purok from health record:', request.id, error)
      }
    }

    if (request.userId) {
      try {
        const userSnap = await getDoc(doc(db, 'users', request.userId))
        const profile = userSnap.data()
        if (profile?.purok) {
          return {
            ...request,
            purok: profile.purok,
            residentName: request.residentName || profile.fullName || 'Resident',
          }
        }
      } catch (error) {
        console.warn('Could not load purok from user profile:', request.id, error)
      }
    }

    return request
  }))
}

const handleHealthRequestSnapshot = (snapshot, callback) => {
  const requests = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))

  callback(requests)

  enrichHealthRequests(requests)
    .then(callback)
    .catch((error) => {
      console.error('Failed to enrich health requests:', error)
    })
}

export const subscribeToPendingRequests = (callback) => {
  const q = query(collection(db, HEALTH_REQUESTS_COLLECTION), where('status', '==', 'pending_review'))
  return onSnapshot(
    q,
    (snapshot) => handleHealthRequestSnapshot(snapshot, callback),
    (error) => {
      console.error('Pending requests subscription error:', error)
      callback([])
    }
  )
}

export const subscribeToProcessedRequests = (callback) => {
  const q = query(
    collection(db, HEALTH_REQUESTS_COLLECTION),
    where('status', 'in', ['scheduled', 'completed', 'inreview', 'rejected'])
  )

  return onSnapshot(
    q,
    (snapshot) => handleHealthRequestSnapshot(snapshot, callback),
    (error) => {
      console.error('Processed requests subscription error:', error)
      callback([])
    }
  )
}

export const subscribeToHealthRequestAnalytics = (callback) => {
  const q = query(collection(db, HEALTH_REQUESTS_COLLECTION))
  return onSnapshot(
    q,
    (snapshot) => handleHealthRequestSnapshot(snapshot, callback),
    (error) => {
      console.error('Health request analytics subscription error:', error)
      callback([])
    }
  )
}

export const updateHealthRequestStatus = async (requestId, updates) => {
  const requestRef = doc(db, HEALTH_REQUESTS_COLLECTION, requestId)

  // Snapshot the status BEFORE updating, so we know whether this status
  // change is entering/leaving the "active" window and needs to free up
  // (or re-claim) its slot in the privacy-safe appointmentSlots collection.
  const beforeSnap = await getDoc(requestRef)
  const beforeData = beforeSnap.data() || {}

  await updateDoc(requestRef, updates)

  const requestSnap = await getDoc(requestRef)
  const requestData = requestSnap.data() || {}

  if (requestData.preferredAppointmentDate && requestData.preferredAppointmentTime) {
    const wasActive = ACTIVE_STATUSES.includes(beforeData.status)
    const isActiveNow = ACTIVE_STATUSES.includes(requestData.status)
    if (wasActive && !isActiveNow) {
      appointmentSlotsService.removeBooking(requestData.preferredAppointmentDate, requestData.preferredAppointmentTime)
    } else if (!wasActive && isActiveNow) {
      appointmentSlotsService.addBooking(requestData.preferredAppointmentDate, requestData.preferredAppointmentTime)
    }
  }

  if (requestData.sourceRecordId) {
    const healthRecordRef = doc(db, 'healthRecords', requestData.sourceRecordId)
    const healthRecordSnap = await getDoc(healthRecordRef)
    const oldApprovalStatus = healthRecordSnap.data()?.approvalStatus || 'pending'

    // Only 'scheduled'/'approved' and 'rejected' represent an actual approval
    // decision. Downstream statuses like 'inreview'/'completed' happen AFTER
    // a request was already approved, so they must NOT overwrite it back to
    // 'pending'. (Previously this fell back to `requestData.approvalStatus`,
    // a field that never exists on health_requests docs, so it always
    // defaulted to 'pending' and silently un-approved the resident's record.)
    const approvalStatus = updates.status === 'scheduled' || updates.status === 'approved'
      ? 'approved'
      : updates.status === 'rejected'
        ? 'rejected'
        : oldApprovalStatus

    await updateDoc(healthRecordRef, {
      approvalStatus,
      updatedAt: updates.updatedAt || new Date().toISOString(),
      reviewedBy: updates.reviewedBy || 'BHW',
      reviewedAt: updates.reviewedAt || new Date().toISOString(),
      reviewNote: updates.reviewMessage || updates.reviewNote || '',
      reviewDecision: updates.decision || 'approved',
      requestedAppointmentDate: updates.requestedAppointmentDate || requestData.requestedAppointmentDate || null,
      requestedAppointmentTime: updates.requestedAppointmentTime || requestData.requestedAppointmentTime || null,
    })

    // Keep the purok's aggregate stats in sync
    purokStatsService.recordHealthStatusChange(requestData.purok, oldApprovalStatus, approvalStatus)
  }

  if (requestData.userId) {
    const notificationMessage = updates.status === 'rejected'
      ? (updates.reviewMessage || 'Your requested date is not available. Please choose another date.')
      : updates.status === 'scheduled'
        ? `Your appointment request has been approved for ${updates.scheduledAt || 'the selected slot'}.`
        : 'Your health request has been updated by the health worker.'

    await notificationService.createNotification({
      userId: requestData.userId,
      type: updates.status === 'rejected' ? 'error' : 'success',
      category: 'health',
      message: notificationMessage,
      relatedId: requestId,
      relatedType: 'healthRequest'
    })
  }

  return { success: true }
}

