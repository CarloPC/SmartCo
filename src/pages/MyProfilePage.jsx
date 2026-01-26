import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Trash2, Plus, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const MyProfilePage = () => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Mock user data - in real app, fetch from backend
  const [userData, setUserData] = useState({
    id: 1,
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@smartco.ph',
    phone: '+63 912 345 6789',
    role: 'Barangay Official',
    purok: 'Purok 3',
    address: 'Toledo City, Cebu',
    dateJoined: '2026-01-01'
  })

  const [editedData, setEditedData] = useState({ ...userData })

  const handleSave = () => {
    // In real app, send PUT request to backend
    setUserData(editedData)
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  const handleCancel = () => {
    setEditedData({ ...userData })
    setIsEditing(false)
  }

  const handleDelete = () => {
    // In real app, send DELETE request to backend
    alert('Account deleted successfully!')
    // Navigate to login or welcome page
    navigate('/')
  }

  const handleInputChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value })
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85"></div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-3 shadow-lg">
              {userData.name.charAt(0)}
            </div>
            {isEditing && (
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Change Photo</span>
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.phone}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Role</span>
              </label>
              {isEditing ? (
                <select
                  value={editedData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Barangay Official</option>
                  <option>Health Worker</option>
                  <option>Volunteer</option>
                  <option>Resident</option>
                </select>
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.role}</p>
              )}
            </div>

            {/* Purok */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Purok</span>
              </label>
              {isEditing ? (
                <select
                  value={editedData.purok}
                  onChange={(e) => handleInputChange('purok', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Purok 1</option>
                  <option>Purok 2</option>
                  <option>Purok 3</option>
                  <option>Purok 4</option>
                  <option>Purok 5</option>
                </select>
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.purok}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </label>
              {isEditing ? (
                <textarea
                  value={editedData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">{userData.address}</p>
              )}
            </div>

            {/* Date Joined */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Member Since</label>
              <p className="text-gray-800 font-medium px-4 py-3 bg-gray-50 rounded-lg">
                {new Date(userData.dateJoined).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
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
                  className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition"
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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Account?</h3>
              <p className="text-gray-600">
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
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
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
