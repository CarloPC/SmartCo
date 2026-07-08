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
}

export default new StorageService()
export { STORAGE_KEYS }
