import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Trash2, User, Mail, Phone, MapPin, Briefcase, Loader } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

const MyProfilePage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user, updateUser, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // User data from Firebase
  const [userData, setUserData] = useState(null)
  const [editedData, setEditedData] = useState(null)

  // Fetch user data on mount
  useEffect(() => {
    if (user) {
      setUserData(user)
      setEditedData(user)
    }
  }, [user])

  const handleSave = async () => {
    if (!userData || !editedData) return

    try {
      setSaving(true)

      // Prepare updates (exclude fields that shouldn't change)
      const updates = {
        fullName: editedData.fullName,
        phone: editedData.phone,
        role: editedData.role,
        purok: editedData.purok
      }

      // Update in Firebase
      await authService.updateProfile(userData.id, updates)

      // Update local state and context
      const updatedUser = { ...userData, ...updates }
      setUserData(updatedUser)
      updateUser(updates)
      setIsEditing(false)

      alert('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('❌ Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({ ...userData })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    // Note: Deleting Firebase Auth users requires re-authentication
    // For now, just logout and show message
    alert('⚠️ Account deletion requires contacting administrator.')
    setShowDeleteConfirm(false)
    
    // Optional: Implement full deletion with re-authentication
    // await authService.deleteAccount()
    // logout()
    // navigate('/')
  }

  const handleInputChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value })
  }

  // Show loading state while fetching user data
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-gray-950/90 via-slate-900/90 to-gray-900/90' : 'from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`}></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 backdrop-blur-sm rounded-lg transition ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 hover:bg-white/30'}`}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-6 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-3 shadow-lg">
              {userData.fullName?.charAt(0) || 'U'}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
                  {userData.fullName || 'Not set'}
                </p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </label>
              <div className={`font-medium px-4 py-3 rounded-lg flex items-center justify-between ${isDarkMode ? 'text-gray-400 bg-gray-700/30' : 'text-gray-600 bg-gray-100'}`}>
                <span>{userData.email}</span>
                <span className="text-xs opacity-60">Cannot be changed</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="+63 XXX XXX XXXX"
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
                  {userData.phone || 'Not set'}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Briefcase className="w-4 h-4" />
                <span>Role</span>
              </label>
              {isEditing ? (
                <select
                  value={editedData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="official">Barangay Official</option>
                  <option value="health">Health Worker</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="resident">Resident</option>
                </select>
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
                  {userData.role === 'official' && 'Barangay Official'}
                  {userData.role === 'health' && 'Health Worker'}
                  {userData.role === 'volunteer' && 'Volunteer'}
                  {userData.role === 'resident' && 'Resident'}
                  {!userData.role && 'Not set'}
                </p>
              )}
            </div>

            {/* Purok */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <MapPin className="w-4 h-4" />
                <span>Purok</span>
              </label>
              {isEditing ? (
                <select
                  value={editedData.purok}
                  onChange={(e) => handleInputChange('purok', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="Purok 1">Purok 1</option>
                  <option value="Purok 2">Purok 2</option>
                  <option value="Purok 3">Purok 3</option>
                  <option value="Purok 4">Purok 4</option>
                  <option value="Purok 5">Purok 5</option>
                </select>
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
                  {userData.purok || 'Not set'}
                </p>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Member Since
              </label>
              <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
                {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className={`w-full flex items-center justify-center space-x-2 font-semibold py-3 rounded-xl transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-lg"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`w-full flex items-center justify-center space-x-2 font-semibold py-3 rounded-xl transition ${isDarkMode ? 'bg-red-900/50 hover:bg-red-900/70 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                <Trash2 className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Delete Account?</h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleDelete}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`w-full font-semibold py-3 rounded-xl transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProfilePage
