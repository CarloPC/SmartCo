import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Key, Eye, EyeOff, Save } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const PrivacySecurityPage = () => {
  const navigate = useNavigate()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!')
      return
    }
    if (passwords.new.length < 8) {
      alert('Password must be at least 8 characters long!')
      return
    }
    // In real app, send to backend
    alert('Password changed successfully!')
    setPasswords({ current: '', new: '', confirm: '' })
  }

  return (
    <div className="min-h-screen relative pb-20">
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
          <h1 className="text-xl font-bold text-white">Privacy & Security</h1>
          <div className="w-10" />
        </div>

        {/* Change Password Section */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Change Password</h3>
          </div>
          
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your account by enabling two-factor authentication (2FA).
            </p>
            
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-800">Enable 2FA</p>
                <p className="text-xs text-gray-500 mt-0.5">Require code from authentication app</p>
              </div>
              <label className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner cursor-pointer"></div>
              </label>
            </div>

            {twoFactorEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Setup Instructions:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Scan the QR code shown in the setup wizard</li>
                  <li>Enter the 6-digit code to verify</li>
                </ol>
                <button className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm transition">
                  Start Setup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Login Activity */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Recent Login Activity</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { device: 'iPhone 13', location: 'Toledo City, Cebu', time: 'Just now', current: true },
              { device: 'Chrome on Windows', location: 'Toledo City, Cebu', time: '2 hours ago', current: false },
              { device: 'Android Phone', location: 'Cebu City', time: '1 day ago', current: false },
            ].map((activity, index) => (
              <div key={index} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-800">{activity.device}</p>
                    {activity.current && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{activity.location}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
                {!activity.current && (
                  <button className="text-red-600 text-sm font-medium hover:text-red-700">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Data & Privacy</h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div>
                <p className="font-medium text-gray-800">Download Your Data</p>
                <p className="text-xs text-gray-500 mt-0.5">Get a copy of your information</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div>
                <p className="font-medium text-gray-800">Privacy Policy</p>
                <p className="text-xs text-gray-500 mt-0.5">Read our privacy policy</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition text-left">
              <div>
                <p className="font-medium text-gray-800">Terms of Service</p>
                <p className="text-xs text-gray-500 mt-0.5">View terms and conditions</p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacySecurityPage
