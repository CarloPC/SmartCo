

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Trash2, User, Mail, Phone, MapPin, Briefcase, Loader, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import storageService from '../services/storageService'
import roleUpgradeService from '../services/roleUpgradeService'
import { PUROKS_ILIHAN } from '../constants/puroks'

const SYSTEM_ROLE_LABELS = {
  admin: 'Administrator',
  barangay_official: 'Barangay Official',
  bhw: 'Barangay Health Worker',
  resident: 'Resident'
}

const MyProfilePage = () => {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // User data from Firebase
  const [userData, setUserData] = useState(null)
  const [editedData, setEditedData] = useState(null)
  const [pendingRoleRequest, setPendingRoleRequest] = useState(null)

  // Fetch user data on mount
  useEffect(() => {
    if (user) {
      setUserData(user)
      setEditedData(user)
    }
  }, [user])

  // Check for a pending role upgrade request so "Current Role" can show
  // a "Pending Review" badge (see Profile step of the role upgrade flow)
  useEffect(() => {
    const fetchPendingRequest = async () => {
      if (!user?.id) return
      const req = await roleUpgradeService.getUserRequest(user.id)
      setPendingRoleRequest(req?.status === 'pending' ? req : null)
    }
    fetchPendingRequest()
  }, [user])

  /* glass card  matches HomePage panels */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'

  const handleSave = async () => {
    if (!userData || !editedData) return

    try {
      setSaving(true)

      // Prepare updates (exclude fields that shouldn't change).
      // NOTE: role is intentionally excluded — it can only change through an
      // approved Role Upgrade Request, never through a direct profile edit.
      const updates = {
        fullName: editedData.fullName,
        phone: editedData.phone,
        purok: editedData.purok
      }

      // Update in Firebase
      await authService.updateProfile(userData.id, updates)

      // Update local state and context
      const updatedUser = { ...userData, ...updates }
      setUserData(updatedUser)
      updateUser(updates)
      setIsEditing(false)

      alert(' Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ã¢Å’ Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !userData) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.')
      return
    }

    try {
      setUploadingImage(true)
      const photoURL = await storageService.uploadProfileImage(userData.id, file)

      await authService.updateProfile(userData.id, { photoURL })

      setUserData({ ...userData, photoURL })
      updateUser({ photoURL })

      alert(' Profile picture updated!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCancel = () => {
    setEditedData({ ...userData })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    // Note: Deleting Firebase Auth users requires re-authentication
    // For now, just logout and show message
    alert(' Account deletion requires contacting administrator.')
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
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className={`${card} px-8 py-10 text-center`}>
          <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-white" />
          <p className="font-semibold text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    /* No background here  Layout.jsx paints the gradient behind everything */
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/20 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">My Profile</h1>
        <div className="w-10" />
      </div>

      {/* Profile Card */}
      <div className={`${card} p-6`}>
        {/* Avatar Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-3 h-24 w-24">
            {userData.photoURL ? (
              <img
                src={userData.photoURL}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover shadow-xl ring-2 ring-sky-300/40"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-4xl font-bold text-white shadow-xl ring-2 ring-sky-300/40">
                {userData.fullName?.charAt(0) || 'U'}
              </div>
            )}

            <label
              htmlFor="profile-image-input"
              className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
            >
              {uploadingImage ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </label>
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>
        </div>
        {/* Profile Information */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 flex items-center space-x-2 text-sm font-medium text-white/70">
              <User className="h-4 w-4" />
              <span>Full Name</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your full name"
              />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">
                {userData.fullName || 'Not set'}
              </p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="mb-1.5 flex items-center space-x-2 text-sm font-medium text-white/70">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </label>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/60">
              <span>{userData.email}</span>
              <span className="text-xs opacity-60">Cannot be changed</span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 flex items-center space-x-2 text-sm font-medium text-white/70">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="+63 XXX XXX XXXX"
              />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">
                {userData.phone || 'Not set'}
              </p>
            )}
          </div>

          {/* Current Role — read-only. Role changes only happen through an
              approved Role Upgrade Request, never through a direct profile
              edit (see roleUpgradeService). */}
          <div>
            <label className="mb-1.5 flex items-center space-x-2 text-sm font-medium text-white/70">
              <Briefcase className="h-4 w-4" />
              <span>Current Role</span>
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="font-medium text-white">
                {SYSTEM_ROLE_LABELS[userData.role] || 'Resident'}
              </span>
              {pendingRoleRequest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                  🟡 Role Upgrade Request — Pending Review
                </span>
              )}
            </div>
            {!pendingRoleRequest && userData.role === 'resident' && (
              <p className="mt-1.5 text-xs text-white/40">
                Need to be listed as a Barangay Official or Health Worker?{' '}
                <Link to="/request-role-upgrade" className="font-medium text-blue-300 hover:underline">
                  Request a role upgrade
                </Link>
              </p>
            )}
          </div>

          {/* Purok */}
          <div>
            <label className="mb-1.5 flex items-center space-x-2 text-sm font-medium text-white/70">
              <MapPin className="h-4 w-4" />
              <span>Purok</span>
            </label>
            {isEditing ? (
              <select
                value={editedData.purok}
                onChange={(e) => handleInputChange('purok', e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 [&>option]:text-gray-900"
              >
                {PUROKS_ILIHAN.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">
                {userData.purok || 'Not set'}
              </p>
            )}
          </div>

          {/* Member Since */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              Member Since
            </label>
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">
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
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
              >
                <Edit2 className="h-5 w-5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-3 font-semibold text-rose-200 backdrop-blur-sm transition hover:bg-rose-500/25"
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete Account</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`${card} w-full max-w-sm p-6`}>
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/15">
                <Trash2 className="h-8 w-8 text-rose-300" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Delete Account?</h3>
              <p className="text-white/60">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleDelete}
                className="w-full rounded-xl bg-rose-500 py-3 font-semibold text-white shadow-lg transition hover:bg-rose-600"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
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


