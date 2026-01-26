import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Key, Eye, EyeOff, Save } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'

const PrivacySecurityPage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
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
          <h1 className="text-xl font-bold text-white">Privacy & Security</h1>
          <div className="w-10" />
        </div>

        {/* Change Password Section */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Lock className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Change Password</h3>
          </div>
          
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
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
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Key className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Two-Factor Authentication</h3>
          </div>
          
          <div className="space-y-4">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add an extra layer of security to your account by enabling two-factor authentication (2FA).
            </p>
            
            <div className={`flex items-center justify-between py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Enable 2FA</p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Require code from authentication app</p>
              </div>
              <label className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className="sr-only peer"
                />
                <div className={`w-12 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              </label>
            </div>

            {twoFactorEnabled && (
              <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Setup Instructions:</p>
                <ol className={`text-sm space-y-1 list-decimal list-inside ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
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
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Recent Login Activity</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { device: 'iPhone 13', location: 'Toledo City, Cebu', time: 'Just now', current: true },
              { device: 'Chrome on Windows', location: 'Toledo City, Cebu', time: '2 hours ago', current: false },
              { device: 'Android Phone', location: 'Cebu City', time: '1 day ago', current: false },
            ].map((activity, index) => (
              <div key={index} className={`flex items-start justify-between py-3 border-b last:border-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{activity.device}</p>
                    {activity.current && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{activity.location}</p>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{activity.time}</p>
                </div>
                {!activity.current && (
                  <button className={`text-sm font-medium ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className={`backdrop-blur-lg rounded-xl shadow-xl p-4 ${isDarkMode ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-white/30'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Data & Privacy</h3>
          </div>
          
          <div className="space-y-3">
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Download Your Data</p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get a copy of your information</p>
              </div>
              <ArrowLeft className={`w-5 h-5 rotate-180 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Privacy Policy</p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Read our privacy policy</p>
              </div>
              <ArrowLeft className={`w-5 h-5 rotate-180 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Terms of Service</p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>View terms and conditions</p>
              </div>
              <ArrowLeft className={`w-5 h-5 rotate-180 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacySecurityPage
