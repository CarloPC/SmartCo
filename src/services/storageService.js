
// localStorage wrapper for data persistence
// This can be easily replaced with real API calls later

const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartco_auth_token',
  USER_DATA: 'smartco_user_data',
  HEALTH_RECORDS: 'smartco_health_records',
  EVENTS: 'smartco_events',
  FOOD_AID: 'smartco_food_aid',
  NOTIFICATIONS: 'smartco_notifications',
  USERS: 'smartco_users'
}

import { supabase } from '../config/supabase'

class StorageService {
  // Upload a profile image and return its public URL
  async uploadProfileImage(userId, file) {
    try {
      if (!file) throw new Error('No file provided')

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/profile-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw new Error('Failed to upload profile image')
    }
  }

  // Upload a supporting document for a Role Upgrade Request (Employee ID,
  // Barangay Certification, or Appointment Letter). Accepts images or PDF.
  // Reuses the same Supabase Storage upload pattern as uploadProfileImage.
  // NOTE: requires a Supabase Storage bucket named "role-upgrade-proofs"
  // (see migration notes) — it is not created automatically.
  async uploadRoleUpgradeProof(userId, file) {
    try {
      if (!file) throw new Error('No file provided')

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, WEBP images or PDF files are accepted')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File must be smaller than 10MB')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/proof-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('role-upgrade-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('role-upgrade-proofs')
        .getPublicUrl(filePath)

      return { url: data.publicUrl, fileName: file.name }
    } catch (error) {
      console.error('Error uploading role upgrade proof:', error)
      throw new Error(error.message || 'Failed to upload proof document')
    }
  }

  // Upload a proof photo for an Emergency Report. Photos only (no PDF) —
  // residents are expected to snap a picture of the actual situation.
  // Reuses the same Supabase Storage upload pattern as the other proof
  // uploaders above.
  // NOTE: requires a Supabase Storage bucket named "emergency-proofs"
  // (see migration notes) — it is not created automatically.
  async uploadEmergencyProof(userId, file) {
    try {
      if (!file) throw new Error('No file provided')

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPG, PNG, or WEBP photos are accepted')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Photo must be smaller than 5MB')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/emergency-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('emergency-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('emergency-proofs')
        .getPublicUrl(filePath)

      return { url: data.publicUrl, path: filePath }
    } catch (error) {
      console.error('Error uploading emergency proof:', error)
      throw new Error(error.message || 'Failed to upload proof photo')
    }
  }
}

export default new StorageService()
export { STORAGE_KEYS }

