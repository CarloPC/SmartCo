import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, Trash2, Plus, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'

const MyProfilePage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
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
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <User className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.email}</p>
              )}
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
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.phone}</p>
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
                  <option>Barangay Official</option>
                  <option>Health Worker</option>
                  <option>Volunteer</option>
                  <option>Resident</option>
                </select>
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.role}</p>
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
                  <option>Purok 1</option>
                  <option>Purok 2</option>
                  <option>Purok 3</option>
                  <option>Purok 4</option>
                  <option>Purok 5</option>
                </select>
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.purok}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </label>
              {isEditing ? (
                <textarea
                  value={editedData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows="2"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              ) : (
                <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>{userData.address}</p>
              )}
            </div>

            {/* Date Joined */}
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Member Since</label>
              <p className={`font-medium px-4 py-3 rounded-lg ${isDarkMode ? 'text-gray-200 bg-gray-700/50' : 'text-gray-800 bg-gray-50'}`}>
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
