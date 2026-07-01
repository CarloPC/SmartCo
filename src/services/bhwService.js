
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import notificationService from './notificationService'

const HEALTH_REQUESTS_COLLECTION = 'health_requests'

export const subscribeToPendingRequests = (callback) => {
  const q = query(collection(db, HEALTH_REQUESTS_COLLECTION), where('status', '==', 'pending_review'))
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    callback(requests)
  })
}

export const subscribeToProcessedRequests = (callback) => {
  const q = query(
    collection(db, HEALTH_REQUESTS_COLLECTION),
    where('status', 'in', ['scheduled', 'completed', 'reviewed', 'referred'])
  )

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    callback(requests)
  })
}

export const subscribeToHealthRequestAnalytics = (callback) => {
  const q = query(collection(db, HEALTH_REQUESTS_COLLECTION))
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    callback(requests)
  })
}

export const updateHealthRequestStatus = async (requestId, updates) => {
  const requestRef = doc(db, HEALTH_REQUESTS_COLLECTION, requestId)
  await updateDoc(requestRef, updates)

  const requestSnap = await getDoc(requestRef)
  const requestData = requestSnap.data() || {}

  if (requestData.sourceRecordId) {
    const approvalStatus = updates.status === 'scheduled' || updates.status === 'approved'
      ? 'approved'
      : updates.status === 'rejected'
        ? 'rejected'
        : requestData.approvalStatus || 'pending'

    await updateDoc(doc(db, 'healthRecords', requestData.sourceRecordId), {
      approvalStatus,
      updatedAt: updates.updatedAt || new Date().toISOString(),
      reviewedBy: updates.reviewedBy || 'BHW',
      reviewedAt: updates.reviewedAt || new Date().toISOString(),
      reviewNote: updates.reviewMessage || updates.reviewNote || '',
      reviewDecision: updates.decision || 'approved',
      requestedAppointmentDate: updates.requestedAppointmentDate || requestData.requestedAppointmentDate || null,
      requestedAppointmentTime: updates.requestedAppointmentTime || requestData.requestedAppointmentTime || null,
    })
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

